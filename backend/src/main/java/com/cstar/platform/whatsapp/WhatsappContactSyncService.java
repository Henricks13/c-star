package com.cstar.platform.whatsapp;

import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.whatsapp.dto.ContactMessageItemResponse;
import com.cstar.platform.whatsapp.dto.ContactSyncResponse;
import com.cstar.platform.whatsapp.model.Contact;
import com.cstar.platform.whatsapp.model.ContactStage;
import com.cstar.platform.whatsapp.model.WhatsappMessage;
import com.cstar.platform.whatsapp.repository.ContactRepository;
import com.cstar.platform.whatsapp.repository.WhatsappMessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WhatsappContactSyncService {

    private final EvolutionApiClient evolutionApiClient;
    private final WhatsappIngestionService ingestionService;
    private final WhatsappProperties properties;
    private final WhatsappMessageRepository whatsappMessageRepository;
    private final ContactRepository contactRepository;
    private final ContactLifecycleService contactLifecycleService;

    public WhatsappContactSyncService(
            EvolutionApiClient evolutionApiClient,
            WhatsappIngestionService ingestionService,
            WhatsappProperties properties,
            WhatsappMessageRepository whatsappMessageRepository,
            ContactRepository contactRepository,
            ContactLifecycleService contactLifecycleService
    ) {
        this.evolutionApiClient = evolutionApiClient;
        this.ingestionService = ingestionService;
        this.properties = properties;
        this.whatsappMessageRepository = whatsappMessageRepository;
        this.contactRepository = contactRepository;
        this.contactLifecycleService = contactLifecycleService;
    }

    public ContactSyncResponse syncUnreadConversations(AuthUserPrincipal principal) {
        if (!"evolution".equalsIgnoreCase(properties.getProvider())) {
            return new ContactSyncResponse(0, 0);
        }

        contactLifecycleService.refreshStagesByOutboundRecency();

        String instanceName = resolveInstanceName(principal);
        List<Map<String, Object>> chats = extractRecords(evolutionApiClient.findChats(instanceName, 400));

        int conversationsSynced = 0;
        int messagesProcessed = 0;

        for (Map<String, Object> chat : chats) {
            String remoteJid = asString(chat.get("remoteJid"));
            if (remoteJid == null || remoteJid.isBlank() || remoteJid.endsWith("@g.us")) {
                continue;
            }

            String phone = normalizeFromJid(remoteJid);
            if (phone == null || phone.isBlank()) {
                continue;
            }

            Contact existingContact = contactRepository.findByWhatsappPhoneE164(phone).orElse(null);
            if (existingContact != null && existingContact.getStage() != ContactStage.LEAD) {
                continue;
            }

            List<Map<String, Object>> probeMessages = extractRecords(evolutionApiClient.findMessages(instanceName, remoteJid, 1));
            Map<String, Object> latest = findLatestByTimestamp(probeMessages);
            if (latest == null || isFromMe(latest)) {
                continue;
            }

            conversationsSynced++;
            String displayName = asString(chat.get("pushName"));

            List<Map<String, Object>> messages = extractRecords(evolutionApiClient.findMessages(instanceName, remoteJid, 25));
            messages.sort(Comparator.comparing(this::extractSentAt));

            for (Map<String, Object> message : messages) {
                String messageId = extractMessageId(message);
                String text = extractText(asMap(message.get("message")));
                Instant sentAt = extractSentAt(message);

                if (isFromMe(message)) {
                    ingestionService.ingestOutbound(phone, displayName, messageId, text, sentAt);
                } else {
                    ingestionService.ingestInbound(phone, displayName, messageId, text, sentAt);
                }
                messagesProcessed++;
            }
        }

        return new ContactSyncResponse(conversationsSynced, messagesProcessed);
    }

    public List<ContactMessageItemResponse> getLatestMessages(UUID contactId, int limit) {
        int safeLimit = Math.max(5, Math.min(limit, 100));
        List<WhatsappMessage> messages = loadLatestMessagesFromDb(contactId, safeLimit);

        if (messages.size() < safeLimit && "evolution".equalsIgnoreCase(properties.getProvider())) {
            backfillLatestMessagesFromEvolution(contactId, null, safeLimit);
            messages = loadLatestMessagesFromDb(contactId, safeLimit);
        }

        return toChronologicalResponse(messages);
    }

    public List<ContactMessageItemResponse> getLatestMessages(UUID contactId, int limit, AuthUserPrincipal principal) {
        int safeLimit = Math.max(5, Math.min(limit, 100));
        List<WhatsappMessage> messages = loadLatestMessagesFromDb(contactId, safeLimit);

        if (messages.size() < safeLimit && "evolution".equalsIgnoreCase(properties.getProvider())) {
            backfillLatestMessagesFromEvolution(contactId, principal, safeLimit);
            messages = loadLatestMessagesFromDb(contactId, safeLimit);
        }

        return toChronologicalResponse(messages);
    }

    private List<WhatsappMessage> loadLatestMessagesFromDb(UUID contactId, int limit) {
        return whatsappMessageRepository.findByConversationContactIdOrderBySentAtDesc(
                contactId,
                PageRequest.of(0, limit)
        );
    }

    private List<ContactMessageItemResponse> toChronologicalResponse(List<WhatsappMessage> messages) {

        List<ContactMessageItemResponse> result = messages.stream()
                .map(message -> new ContactMessageItemResponse(
                        message.getId(),
                        message.getDirection().name(),
                        message.getBody(),
                        message.getSentAt(),
                        message.getWaMessageId()
                ))
                .toList();

        List<ContactMessageItemResponse> chronological = new ArrayList<>(result);
        chronological.sort(Comparator.comparing(ContactMessageItemResponse::sentAt));
        return chronological;
    }

    private void backfillLatestMessagesFromEvolution(UUID contactId, AuthUserPrincipal principal, int safeLimit) {
        Contact contact = contactRepository.findById(contactId).orElse(null);
        if (contact == null || contact.getWhatsappPhoneE164() == null || contact.getWhatsappPhoneE164().isBlank()) {
            return;
        }

        String instanceName = resolveInstanceName(principal);
        String digits = contact.getWhatsappPhoneE164().replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return;
        }

        String remoteJid = digits + "@s.whatsapp.net";
        int fetchLimit = Math.max(25, safeLimit * 3);

        List<Map<String, Object>> messages = extractRecords(evolutionApiClient.findMessages(instanceName, remoteJid, fetchLimit));
        messages.sort(Comparator.comparing(this::extractSentAt));

        for (Map<String, Object> message : messages) {
            String messageId = extractMessageId(message);
            String text = extractText(asMap(message.get("message")));
            Instant sentAt = extractSentAt(message);

            if (isFromMe(message)) {
                ingestionService.ingestOutbound(contact.getWhatsappPhoneE164(), contact.getFullName(), messageId, text, sentAt);
            } else {
                ingestionService.ingestInbound(contact.getWhatsappPhoneE164(), contact.getFullName(), messageId, text, sentAt);
            }
        }
    }

    private String resolveInstanceName(AuthUserPrincipal principal) {
        String suffix = "default";
        if (principal != null && principal.getUserId() != null) {
            suffix = principal.getUserId().toString();
        }
        suffix = suffix.replaceAll("[^a-zA-Z0-9_-]", "");
        return properties.getInstancePrefix() + "-" + suffix;
    }

    private String extractMessageId(Map<String, Object> message) {
        Map<String, Object> key = asMap(message.get("key"));
        return asString(key.get("id"));
    }

    private boolean isFromMe(Map<String, Object> message) {
        Map<String, Object> key = asMap(message.get("key"));
        Object fromMe = key.get("fromMe");
        return Boolean.TRUE.equals(fromMe);
    }

    private String normalizeFromJid(String jid) {
        if (jid == null || jid.isBlank()) {
            return null;
        }
        String head = jid.split("@")[0];
        String digits = head.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return null;
        }
        return "+" + digits;
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

        Map<String, Object> video = asMap(message.get("videoMessage"));
        String videoCaption = asString(video.get("caption"));
        if (videoCaption != null) {
            return videoCaption;
        }

        return "";
    }

    private Instant extractSentAt(Map<String, Object> message) {
        Object value = message.get("messageTimestamp");
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

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractRecords(Map<String, Object> payload) {
        Object recordsNode = findFirstRecordsNode(payload);
        if (!(recordsNode instanceof List<?> records)) {
            return List.of();
        }

        return records.stream()
                .filter(item -> item instanceof Map<?, ?>)
                .map(item -> (Map<String, Object>) item)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private Object findFirstRecordsNode(Object node) {
        if (node == null) {
            return null;
        }

        if (node instanceof Map<?, ?> map) {
            if (map.containsKey("records")) {
                return map.get("records");
            }
            for (Object value : map.values()) {
                Object nested = findFirstRecordsNode(value);
                if (nested != null) {
                    return nested;
                }
            }
            return null;
        }

        if (node instanceof Iterable<?> iterable) {
            for (Object value : iterable) {
                Object nested = findFirstRecordsNode(value);
                if (nested != null) {
                    return nested;
                }
            }
        }

        return null;
    }

    private Map<String, Object> findLatestByTimestamp(List<Map<String, Object>> messages) {
        return messages.stream()
                .max(Comparator.comparing(this::extractSentAt))
                .orElse(null);
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
}
