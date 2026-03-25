package com.cstar.platform.whatsapp;

import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.whatsapp.dto.WhatsappQrCodeResponse;
import com.cstar.platform.whatsapp.dto.WhatsappSessionInfoResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WhatsappSessionService {

    private static final String PROVIDER_NAME = "mock-local";
    private static final String DEFAULT_PHONE = "+55 11 99999-0000";
    private static final long QR_CACHE_TTL_SECONDS = 120;
    private static final String GLOBAL_SESSION_KEY = "global";

    private final EvolutionApiClient evolutionApiClient;
    private final WhatsappIngestionService ingestionService;
    private final WhatsappProperties properties;
    private final String publicBaseUrl;

    private final Map<String, SessionState> sessions = new ConcurrentHashMap<>();
    private final Map<String, QrSnapshot> evolutionQrCache = new ConcurrentHashMap<>();

    public WhatsappSessionService(
            EvolutionApiClient evolutionApiClient,
            WhatsappIngestionService ingestionService,
            WhatsappProperties properties,
            @Value("${app.whatsapp.public-base-url:http://localhost:8080}") String publicBaseUrl
    ) {
        this.evolutionApiClient = evolutionApiClient;
        this.ingestionService = ingestionService;
        this.properties = properties;
        this.publicBaseUrl = publicBaseUrl;
    }

    public WhatsappSessionInfoResponse getSession(AuthUserPrincipal principal) {
        if (isEvolutionProvider()) {
            return evolutionSession(principal);
        }

        SessionState state = sessions.computeIfAbsent(resolveSessionKey(principal), key -> SessionState.disconnected());
        state.lastSyncAt = Instant.now();
        return toResponse(state);
    }

    public WhatsappQrCodeResponse generateQrCode(AuthUserPrincipal principal) {
        if (isEvolutionProvider()) {
            String instanceName = resolveInstanceName(principal);
            Map<String, Object> created = evolutionApiClient.createInstance(instanceName, buildWebhookUrl());
            Map<String, Object> qr = evolutionApiClient.fetchQrCode(instanceName);

            String code = resolveQrBase64(qr);
            if (code == null || code.isBlank()) {
                code = resolveQrBase64(created);
            }
            if (code == null || code.isBlank()) {
                code = resolveCachedQr(instanceName);
            }

            return new WhatsappQrCodeResponse(code == null ? "" : code, Instant.now().plus(2, ChronoUnit.MINUTES));
        }

        String sessionKey = resolveSessionKey(principal);
        SessionState state = sessions.computeIfAbsent(sessionKey, key -> SessionState.disconnected());

        String payload = "CSTAR-WHATSAPP-" + sessionKey + "-" + UUID.randomUUID();
        Instant expiresAt = Instant.now().plus(2, ChronoUnit.MINUTES);
        String dataUrl = buildSvgDataUrl(payload);

        state.pendingQrDataUrl = dataUrl;
        state.qrExpiresAt = expiresAt;
        state.lastSyncAt = Instant.now();

        return new WhatsappQrCodeResponse(dataUrl, expiresAt);
    }

    public WhatsappSessionInfoResponse connect(AuthUserPrincipal principal) {
        if (isEvolutionProvider()) {
            String instanceName = resolveInstanceName(principal);
            evolutionApiClient.connectInstance(instanceName);
            return evolutionSession(principal);
        }

        String sessionKey = resolveSessionKey(principal);
        SessionState state = sessions.computeIfAbsent(sessionKey, key -> SessionState.disconnected());

        state.connected = true;
        state.displayName = "Conta C-Star";
        state.phoneNumber = DEFAULT_PHONE;
        state.connectedAt = state.connectedAt == null ? Instant.now() : state.connectedAt;
        state.lastSyncAt = Instant.now();
        state.pendingQrDataUrl = null;
        state.qrExpiresAt = null;

        return toResponse(state);
    }

    public void disconnect(AuthUserPrincipal principal) {
        if (isEvolutionProvider()) {
            String instanceName = resolveInstanceName(principal);
            boolean disconnected = evolutionApiClient.disconnectInstance(instanceName);
            if (!disconnected) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Não foi possível desconectar na Evolution API. Tente novamente.");
            }
            evolutionQrCache.remove(instanceName);
            return;
        }

        String sessionKey = resolveSessionKey(principal);
        SessionState state = sessions.computeIfAbsent(sessionKey, key -> SessionState.disconnected());

        state.connected = false;
        state.connectedAt = null;
        state.lastSyncAt = Instant.now();
        state.pendingQrDataUrl = null;
        state.qrExpiresAt = null;
    }

    public void sendText(AuthUserPrincipal principal, String phone, String text) {
        String instanceName = resolveInstanceName(principal);
        evolutionApiClient.sendText(instanceName, phone, text);
        ingestionService.ingestOutbound(normalizePhone(phone), null, null, text, Instant.now());
    }

    @SuppressWarnings("unchecked")
    public void handleEvolutionWebhook(String secret, Map<String, Object> payload) {
        if (!properties.getWebhookSecret().equals(secret)) {
            return;
        }

        String event = asString(payload.get("event"));
        if (event != null && event.toLowerCase().contains("qrcode")) {
            String instanceName = extractInstanceName(payload);
            if (instanceName != null && !instanceName.isBlank()) {
                String qrBase64 = resolveQrBase64(payload);
                if (qrBase64 != null && !qrBase64.isBlank()) {
                    evolutionQrCache.put(instanceName, new QrSnapshot(qrBase64, Instant.now().plusSeconds(QR_CACHE_TTL_SECONDS)));
                }
            }
            return;
        }

        if (event == null || !event.toLowerCase().contains("messages")) {
            return;
        }

        Object dataNode = payload.get("data");
        if (!(dataNode instanceof Map<?, ?> dataMapRaw)) {
            return;
        }

        Map<String, Object> dataMap = (Map<String, Object>) dataMapRaw;
        Map<String, Object> key = asMap(dataMap.get("key"));
        String remoteJid = asString(key.get("remoteJid"));
        if (remoteJid == null || remoteJid.endsWith("@g.us")) {
            return;
        }

        String messageId = asString(key.get("id"));
        boolean fromMe = Boolean.TRUE.equals(key.get("fromMe"));
        String phone = normalizeFromJid(remoteJid);

        Map<String, Object> pushNameMap = asMap(payload.get("sender"));
        String displayName = asString(pushNameMap.get("pushName"));
        if (displayName == null) {
            displayName = asString(dataMap.get("pushName"));
        }

        Map<String, Object> message = asMap(dataMap.get("message"));
        String text = extractText(message);
        Instant sentAt = extractSentAt(dataMap.get("messageTimestamp"));

        if (fromMe) {
            ingestionService.ingestOutbound(phone, displayName, messageId, text, sentAt);
        } else {
            ingestionService.ingestInbound(phone, displayName, messageId, text, sentAt);
        }
    }

    private WhatsappSessionInfoResponse toResponse(SessionState state) {
        return new WhatsappSessionInfoResponse(
                state.connected,
                state.displayName,
                state.phoneNumber,
                null,
                PROVIDER_NAME,
                state.connectedAt,
                state.lastSyncAt
        );
    }

    private String resolveSessionKey(AuthUserPrincipal principal) {
        return GLOBAL_SESSION_KEY;
    }

    private String resolveInstanceName(AuthUserPrincipal principal) {
        return properties.getInstancePrefix() + "-" + GLOBAL_SESSION_KEY;
    }

    private boolean isEvolutionProvider() {
        return "evolution".equalsIgnoreCase(properties.getProvider());
    }

    private String buildWebhookUrl() {
        return publicBaseUrl + "/api/public/whatsapp/evolution/webhook?secret=" + properties.getWebhookSecret();
    }

    private WhatsappSessionInfoResponse evolutionSession(AuthUserPrincipal principal) {
        String instanceName = resolveInstanceName(principal);
        Map<String, Object> stateResponse = evolutionApiClient.connectionState(instanceName);
        String state = resolveState(stateResponse);
        boolean connected = "open".equalsIgnoreCase(state);
        EvolutionInstanceInfo instanceInfo = resolveEvolutionInstanceInfo(instanceName);

        String displayName = instanceInfo.displayName() != null && !instanceInfo.displayName().isBlank()
            ? instanceInfo.displayName()
            : "Conta C-Star";

        String phoneNumber = connected ? instanceInfo.phoneNumber() : null;

        return new WhatsappSessionInfoResponse(
                connected,
                displayName,
                phoneNumber,
                instanceInfo.profilePicUrl(),
                "evolution",
                connected ? Instant.now() : null,
                Instant.now()
        );
    }

    private EvolutionInstanceInfo resolveEvolutionInstanceInfo(String instanceName) {
        List<Map<String, Object>> instances = evolutionApiClient.fetchInstances();
        if (instances.isEmpty()) {
            return EvolutionInstanceInfo.empty();
        }

        return instances.stream()
            .filter(instance -> instanceName.equalsIgnoreCase(asString(instance.get("name"))))
            .findFirst()
            .map(instance -> new EvolutionInstanceInfo(
                asString(instance.get("profileName")),
                normalizeFromJid(asString(instance.get("ownerJid"))),
                asString(instance.get("profilePicUrl"))
            ))
            .orElse(EvolutionInstanceInfo.empty());
    }

    private String resolveState(Map<String, Object> response) {
        Object instance = response.get("instance");
        if (instance instanceof Map<?, ?> instanceMap) {
            Object status = instanceMap.get("state");
            if (status instanceof String value) {
                return value;
            }
            Object statusAlt = instanceMap.get("status");
            if (statusAlt instanceof String value) {
                return value;
            }
        }

        Object state = response.get("state");
        if (state instanceof String value) {
            return value;
        }
        return "close";
    }

    private String resolveCachedQr(String instanceName) {
        QrSnapshot snapshot = evolutionQrCache.get(instanceName);
        if (snapshot == null) {
            return null;
        }

        if (snapshot.expiresAt().isBefore(Instant.now())) {
            evolutionQrCache.remove(instanceName);
            return null;
        }

        return snapshot.base64();
    }

    private String extractInstanceName(Map<String, Object> payload) {
        String direct = asString(payload.get("instanceName"));
        if (direct != null && !direct.isBlank()) {
            return direct;
        }

        Object instance = payload.get("instance");
        if (instance instanceof String value && !value.isBlank()) {
            return value;
        }

        Map<String, Object> instanceMap = asMap(instance);
        String fromMap = asString(instanceMap.get("instanceName"));
        if (fromMap != null && !fromMap.isBlank()) {
            return fromMap;
        }

        Map<String, Object> data = asMap(payload.get("data"));
        String fromData = asString(data.get("instanceName"));
        if (fromData != null && !fromData.isBlank()) {
            return fromData;
        }

        return asString(data.get("instance"));
    }

    @SuppressWarnings("unchecked")
    private String resolveQrBase64(Map<String, Object> response) {
        if (response == null || response.isEmpty()) {
            return null;
        }

        Object directBase64 = response.get("base64");
        if (directBase64 instanceof String directValue && !directValue.isBlank()) {
            return directValue;
        }

        Object qrcode = response.get("qrcode");
        if (qrcode instanceof Map<?, ?> qrcodeMap) {
            Object base64 = ((Map<String, Object>) qrcodeMap).get("base64");
            if (base64 instanceof String value && !value.isBlank()) {
                return value;
            }
        }

        return findBase64Value(response);
    }

    @SuppressWarnings("unchecked")
    private String findBase64Value(Object node) {
        if (node == null) {
            return null;
        }

        if (node instanceof Map<?, ?> mapNode) {
            Object maybeBase64 = ((Map<String, Object>) mapNode).get("base64");
            if (maybeBase64 instanceof String value && !value.isBlank()) {
                return value;
            }

            for (Object value : mapNode.values()) {
                String found = findBase64Value(value);
                if (found != null && !found.isBlank()) {
                    return found;
                }
            }
            return null;
        }

        if (node instanceof Iterable<?> iterable) {
            for (Object value : iterable) {
                String found = findBase64Value(value);
                if (found != null && !found.isBlank()) {
                    return found;
                }
            }
        }

        return null;
    }

    private record QrSnapshot(String base64, Instant expiresAt) {
    }

    private record EvolutionInstanceInfo(String displayName, String phoneNumber, String profilePicUrl) {
        private static EvolutionInstanceInfo empty() {
            return new EvolutionInstanceInfo(null, null, null);
        }
    }

    private String normalizePhone(String raw) {
        if (raw == null) {
            return null;
        }
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return null;
        }
        return "+" + digits;
    }

    private String normalizeFromJid(String jid) {
        String head = jid.split("@")[0];
        String digits = head.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return null;
        }
        return "+" + digits;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String text) {
            return text;
        }
        return String.valueOf(value);
    }

    private String extractText(Map<String, Object> message) {
        String conversation = asString(message.get("conversation"));
        if (conversation != null) {
            return conversation;
        }

        Map<String, Object> extended = asMap(message.get("extendedTextMessage"));
        String extendedText = asString(extended.get("text"));
        if (extendedText != null) {
            return extendedText;
        }

        Map<String, Object> image = asMap(message.get("imageMessage"));
        String imageCaption = asString(image.get("caption"));
        if (imageCaption != null) {
            return imageCaption;
        }

        return "";
    }

    private Instant extractSentAt(Object value) {
        if (value == null) {
            return Instant.now();
        }
        if (value instanceof Number number) {
            return Instant.ofEpochSecond(number.longValue());
        }
        String raw = asString(value);
        if (raw == null || raw.isBlank()) {
            return Instant.now();
        }
        try {
            return Instant.ofEpochSecond(Long.parseLong(raw));
        } catch (NumberFormatException ex) {
            return Instant.now();
        }
    }

    private String buildSvgDataUrl(String text) {
        String svg = """
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'>
                  <rect width='320' height='320' fill='#ffffff'/>
                  <rect x='16' y='16' width='288' height='288' fill='none' stroke='#111111' stroke-width='8'/>
                  <rect x='40' y='40' width='48' height='48' fill='#111111'/>
                  <rect x='104' y='40' width='24' height='24' fill='#111111'/>
                  <rect x='136' y='40' width='24' height='24' fill='#111111'/>
                  <rect x='168' y='40' width='48' height='48' fill='#111111'/>
                  <rect x='232' y='40' width='48' height='48' fill='#111111'/>
                  <rect x='40' y='104' width='24' height='24' fill='#111111'/>
                  <rect x='72' y='104' width='48' height='48' fill='#111111'/>
                  <rect x='136' y='104' width='24' height='24' fill='#111111'/>
                  <rect x='200' y='104' width='24' height='24' fill='#111111'/>
                  <rect x='232' y='104' width='24' height='24' fill='#111111'/>
                  <rect x='264' y='104' width='24' height='24' fill='#111111'/>
                  <rect x='40' y='168' width='48' height='48' fill='#111111'/>
                  <rect x='104' y='168' width='24' height='24' fill='#111111'/>
                  <rect x='136' y='168' width='48' height='48' fill='#111111'/>
                  <rect x='200' y='168' width='48' height='48' fill='#111111'/>
                  <rect x='264' y='168' width='24' height='24' fill='#111111'/>
                  <rect x='40' y='232' width='24' height='24' fill='#111111'/>
                  <rect x='72' y='232' width='24' height='24' fill='#111111'/>
                  <rect x='136' y='232' width='24' height='24' fill='#111111'/>
                  <rect x='168' y='232' width='24' height='24' fill='#111111'/>
                  <rect x='232' y='232' width='48' height='48' fill='#111111'/>
                  <text x='160' y='302' text-anchor='middle' font-family='Arial' font-size='11' fill='#111111'>%s</text>
                </svg>
                """.formatted(text.substring(0, Math.min(text.length(), 26)));

        String encoded = Base64.getEncoder().encodeToString(svg.getBytes(StandardCharsets.UTF_8));
        return "data:image/svg+xml;base64," + encoded;
    }

    private static final class SessionState {
        private boolean connected;
        private String displayName;
        private String phoneNumber;
        private Instant connectedAt;
        private Instant lastSyncAt;
        private String pendingQrDataUrl;
        private Instant qrExpiresAt;

        private static SessionState disconnected() {
            SessionState state = new SessionState();
            state.connected = false;
            state.lastSyncAt = Instant.now();
            return state;
        }
    }
}
