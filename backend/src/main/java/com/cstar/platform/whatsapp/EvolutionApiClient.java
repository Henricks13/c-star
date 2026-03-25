package com.cstar.platform.whatsapp;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class EvolutionApiClient {

    private static final Logger log = LoggerFactory.getLogger(EvolutionApiClient.class);

    private final WhatsappProperties properties;
    private final RestTemplate restTemplate;

    public EvolutionApiClient(WhatsappProperties properties) {
        this.properties = properties;
        this.restTemplate = new RestTemplate();
    }

    public Map<String, Object> createInstance(String instanceName, String webhookUrl) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/create";

        Map<String, Object> body = new HashMap<>();
        body.put("instanceName", instanceName);
        body.put("integration", "WHATSAPP-BAILEYS");
        body.put("qrcode", true);

        Map<String, Object> webhook = new HashMap<>();
        webhook.put("url", webhookUrl);
        webhook.put("byEvents", true);
        webhook.put("base64", true);
        webhook.put("events", new String[]{"MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"});
        body.put("webhook", webhook);

        return post(url, body);
    }

    public Map<String, Object> connectInstance(String instanceName) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/connect/" + instanceName;
        return get(url);
    }

    public Map<String, Object> connectionState(String instanceName) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/connectionState/" + instanceName;
        Map<String, Object> response = get(url);
        return response.isEmpty() ? Map.of("state", "close") : response;
    }

    public Map<String, Object> fetchQrCode(String instanceName) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/connect/" + instanceName;
        return get(url);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> fetchInstances() {
        String url = properties.getEvolution().getBaseUrl() + "/instance/fetchInstances";
        HttpEntity<Void> request = new HttpEntity<>(headers());
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, request, Object.class);
            Object body = response.getBody();
            if (body instanceof List<?> list) {
                return list.stream()
                        .filter(item -> item instanceof Map<?, ?>)
                        .map(item -> (Map<String, Object>) item)
                        .toList();
            }

            if (body instanceof Map<?, ?> map) {
                return List.of((Map<String, Object>) map);
            }

            return List.of();
        } catch (RestClientException ex) {
            log.warn("Evolution API fetchInstances failed: {}", url, ex);
            return List.of();
        }
    }

    public void logout(String instanceName) {
        String url = properties.getEvolution().getBaseUrl() + "/instance/logout/" + instanceName;
        post(url, Map.of());
    }

    public boolean disconnectInstance(String instanceName) {
        String baseUrl = properties.getEvolution().getBaseUrl();
        String logoutUrl = baseUrl + "/instance/logout/" + instanceName;

        post(logoutUrl, Map.of());
        request(logoutUrl, HttpMethod.DELETE, null);
        request(logoutUrl, HttpMethod.GET, null);

        for (int attempt = 0; attempt < 6; attempt++) {
            String state = resolveState(connectionState(instanceName));
            if ("close".equalsIgnoreCase(state) || "closed".equalsIgnoreCase(state) || "disconnected".equalsIgnoreCase(state)) {
                return true;
            }

            try {
                TimeUnit.MILLISECONDS.sleep(350);
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        return false;
    }

    public Map<String, Object> sendText(String instanceName, String number, String text) {
        String url = properties.getEvolution().getBaseUrl() + "/message/sendText/" + instanceName;
        return post(url, Map.of("number", number, "text", text));
    }

    public Map<String, Object> findChats(String instanceName, int limit) {
        return findChats(instanceName, 1, limit);
    }

    public Map<String, Object> findChats(String instanceName, int page, int limit) {
        String url = properties.getEvolution().getBaseUrl() + "/chat/findChats/" + instanceName;
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(limit, 500));
        Map<String, Object> payload = new HashMap<>();
        payload.put("page", safePage);
        payload.put("limit", safeLimit);
        return post(url, payload);
    }

    public Map<String, Object> findMessages(String instanceName, String remoteJid, int limit) {
        return findMessages(instanceName, remoteJid, 1, limit);
    }

    public Map<String, Object> findMessages(String instanceName, String remoteJid, int page, int limit) {
        String url = properties.getEvolution().getBaseUrl() + "/chat/findMessages/" + instanceName;
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, Math.min(limit, 100));

        Map<String, Object> keyFilter = new HashMap<>();
        keyFilter.put("remoteJid", remoteJid);

        Map<String, Object> where = new HashMap<>();
        where.put("key", keyFilter);

        Map<String, Object> payload = new HashMap<>();
        payload.put("where", where);
        payload.put("page", safePage);
        payload.put("limit", safeLimit);

        return post(url, payload);
    }

    public void assertApiReachable() {
        String url = properties.getEvolution().getBaseUrl() + "/instance/fetchInstances";
        HttpEntity<Void> request = new HttpEntity<>(headers());
        try {
            restTemplate.exchange(url, HttpMethod.GET, request, Object.class);
        } catch (RestClientException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível conectar na Evolution API. Verifique EVOLUTION_BASE_URL e EVOLUTION_API_KEY.",
                    ex
            );
        }
    }

    private Map<String, Object> get(String url) {
        HttpEntity<Void> request = new HttpEntity<>(headers());
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, request, Object.class);
            return normalizeBody(response.getBody());
        } catch (RestClientException ex) {
            log.warn("Evolution API GET failed: {}", url, ex);
            return Map.of();
        }
    }

    private Map<String, Object> post(String url, Object body) {
        return request(url, HttpMethod.POST, body);
    }

    private Map<String, Object> request(String url, HttpMethod method, Object body) {
        HttpEntity<Object> request = body == null
                ? new HttpEntity<>(headers())
                : new HttpEntity<>(body, headers());
        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, method, request, Object.class);
            return normalizeBody(response.getBody());
        } catch (RestClientException ex) {
            log.warn("Evolution API {} failed: {}", method, url, ex);
            return Map.of();
        }
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> normalizeBody(Object body) {
        if (body == null) {
            return Map.of();
        }

        if (body instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }

        if (body instanceof List<?> list) {
            return Map.of("records", list);
        }

        return Map.of("value", body);
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (properties.getEvolution().getApiKey() != null && !properties.getEvolution().getApiKey().isBlank()) {
            headers.set("apikey", properties.getEvolution().getApiKey());
        }
        return headers;
    }
}
