package com.cstar.platform.whatsapp;

import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.whatsapp.dto.ContactMessageItemResponse;
import com.cstar.platform.whatsapp.dto.ContactSyncResponse;
import com.cstar.platform.whatsapp.model.Contact;
import com.cstar.platform.whatsapp.model.ContactStage;
import com.cstar.platform.whatsapp.model.WhatsappMessage;
import com.cstar.platform.whatsapp.repository.ContactRepository;
import com.cstar.platform.whatsapp.repository.WhatsappMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WhatsappContactSyncService {

    private static final Logger log = LoggerFactory.getLogger(WhatsappContactSyncService.class);
    private static final int CHAT_PAGE_SIZE = 500;
    private static final int CHAT_MAX_PAGES = 200;
    private static final int MESSAGE_PAGE_SIZE = 100;
    private static final int MESSAGE_MAX_PAGES = 10_000;

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
        List<Map<String, Object>> chats = fetchAllChats(instanceName, CHAT_PAGE_SIZE, CHAT_MAX_PAGES);

        int conversationsSynced = 0;
        int messagesProcessed = 0;
        int skippedNoRemoteJid = 0;
        int skippedNoPhone = 0;
        int skippedStage = 0;
        int skippedNoInbound = 0;

        for (Map<String, Object> chat : chats) {
            String remoteJid = extractRemoteJid(chat);
            if (remoteJid == null || remoteJid.isBlank() || remoteJid.endsWith("@g.us")) {
                skippedNoRemoteJid++;
                continue;
            }

            String phone = normalizeFromJid(remoteJid);
            if (phone == null || phone.isBlank()) {
                skippedNoPhone++;
                continue;
            }

            Contact existingContact = contactRepository.findByWhatsappPhoneE164(phone).orElse(null);
            if (existingContact != null && existingContact.getStage() != ContactStage.LEAD) {
                skippedStage++;
                continue;
            }

            List<Map<String, Object>> messages = fetchAllMessages(instanceName, remoteJid, MESSAGE_PAGE_SIZE, MESSAGE_MAX_PAGES);
            int unreadCount = extractUnreadCount(chat);
            boolean hasUnreadMessages = unreadCount > 0;
            boolean hasInboundInConversation = messages.stream().anyMatch(message -> !isFromMe(message));

            if (!hasUnreadMessages && !hasInboundInConversation) {
                skippedNoInbound++;
                continue;
            }

            conversationsSynced++;
            String displayName = resolveDisplayName(chat, phone);
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

        log.info(
                "Whatsapp sync completed for instance {}: chatsFetched={}, conversationsSynced={}, messagesProcessed={}, skippedNoRemoteJid={}, skippedNoPhone={}, skippedByStage={}, skippedNoInboundOrUnread={}",
                instanceName,
                chats.size(),
                conversationsSynced,
                messagesProcessed,
                skippedNoRemoteJid,
                skippedNoPhone,
                skippedStage,
                skippedNoInbound
            );

        return new ContactSyncResponse(conversationsSynced, messagesProcessed);
    }

    private List<Map<String, Object>> fetchAllChats(String instanceName, int pageSize, int maxPages) {
        int safePageSize = Math.max(50, Math.min(pageSize, 500));
        int safeMaxPages = Math.max(1, maxPages);

        Map<String, Map<String, Object>> uniqueChatsByJid = new LinkedHashMap<>();
        int pagesWithoutGrowth = 0;
        for (int page = 1; page <= safeMaxPages; page++) {
            List<Map<String, Object>> pageRecords = extractRecords(evolutionApiClient.findChats(instanceName, page, safePageSize));
            if (pageRecords.isEmpty()) {
                break;
            }

            int beforeCount = uniqueChatsByJid.size();
            for (Map<String, Object> chat : pageRecords) {
                String remoteJid = extractRemoteJid(chat);
                if (remoteJid == null || remoteJid.isBlank()) {
                    continue;
                }
                uniqueChatsByJid.putIfAbsent(remoteJid, chat);
            }

            if (uniqueChatsByJid.size() == beforeCount) {
                pagesWithoutGrowth++;
            } else {
                pagesWithoutGrowth = 0;
            }

            if (pagesWithoutGrowth >= 2) {
                break;
            }
        }

        return new ArrayList<>(uniqueChatsByJid.values());
    }

    private List<Map<String, Object>> fetchAllMessages(String instanceName, String remoteJid, int pageSize, int maxPages) {
        int safePageSize = Math.max(1, Math.min(pageSize, 100));
        int safeMaxPages = Math.max(1, maxPages);

        List<Map<String, Object>> allMessages = new ArrayList<>();
        int pagesWithoutGrowth = 0;

        for (int page = 1; page <= safeMaxPages; page++) {
            List<Map<String, Object>> pageRecords = extractRecords(
                    evolutionApiClient.findMessages(instanceName, remoteJid, page, safePageSize)
            );

            if (pageRecords.isEmpty()) {
                break;
            }

            int beforeCount = allMessages.size();
            allMessages.addAll(pageRecords);

            if (allMessages.size() == beforeCount) {
                pagesWithoutGrowth++;
            } else {
                pagesWithoutGrowth = 0;
            }

            if (pagesWithoutGrowth >= 2 || pageRecords.size() < safePageSize) {
                break;
            }
        }

        return allMessages;
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

    private String resolveDisplayName(Map<String, Object> chat, String phone) {
        String pushName = asString(chat.get("pushName"));
        if (pushName != null && !pushName.isBlank()) {
            return pushName;
        }

        String name = asString(chat.get("name"));
        if (name != null && !name.isBlank()) {
            return name;
        }

        String profileName = asString(chat.get("profileName"));
        if (profileName != null && !profileName.isBlank()) {
            return profileName;
        }

        String notify = asString(chat.get("notify"));
        if (notify != null && !notify.isBlank()) {
            return notify;
        }

        return phone;
    }

    private String extractRemoteJid(Map<String, Object> chat) {
        String remoteJid = asString(chat.get("remoteJid"));
        if (remoteJid != null && !remoteJid.isBlank()) {
            return remoteJid;
        }

        String id = asString(chat.get("id"));
        if (id != null && id.contains("@")) {
            return id;
        }

        String jid = asString(chat.get("jid"));
        if (jid != null && jid.contains("@")) {
            return jid;
        }

        Map<String, Object> key = asMap(chat.get("key"));
        String nestedRemoteJid = asString(key.get("remoteJid"));
        if (nestedRemoteJid != null && nestedRemoteJid.contains("@")) {
            return nestedRemoteJid;
        }

        String nestedId = asString(key.get("id"));
        if (nestedId != null && nestedId.contains("@")) {
            return nestedId;
        }

        return null;
    }

    private int extractUnreadCount(Map<String, Object> chat) {
        int unreadCount = parseInteger(chat.get("unreadCount"));
        if (unreadCount > 0) {
            return unreadCount;
        }

        int unreadMessageCount = parseInteger(chat.get("unreadMessageCount"));
        if (unreadMessageCount > 0) {
            return unreadMessageCount;
        }

        int unreadMessages = parseInteger(chat.get("unreadMessages"));
        if (unreadMessages > 0) {
            return unreadMessages;
        }

        int unread = parseInteger(chat.get("unread"));
        if (unread > 0) {
            return unread;
        }

        Map<String, Object> stats = asMap(chat.get("stats"));
        int statsUnread = parseInteger(stats.get("unread"));
        if (statsUnread > 0) {
            return statsUnread;
        }

        Map<String, Object> metadata = asMap(chat.get("metadata"));
        return parseInteger(metadata.get("unreadCount"));
    }

    private int parseInteger(Object value) {
        if (value == null) {
            return 0;
        }

        if (value instanceof Number number) {
            return Math.max(0, number.intValue());
        }

        String raw = asString(value);
        if (raw == null || raw.isBlank()) {
            return 0;
        }

        String digits = raw.replaceAll("[^0-9-]", "");
        if (digits.isBlank()) {
            return 0;
        }

        try {
            return Math.max(0, Integer.parseInt(digits));
        } catch (NumberFormatException ex) {
            return 0;
        }
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
