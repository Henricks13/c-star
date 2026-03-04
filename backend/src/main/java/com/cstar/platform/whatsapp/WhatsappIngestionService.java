package com.cstar.platform.whatsapp;

import com.cstar.platform.whatsapp.model.Contact;
import com.cstar.platform.whatsapp.model.ConversationSummary;
import com.cstar.platform.whatsapp.model.MessageDirection;
import com.cstar.platform.whatsapp.model.WhatsappMessage;
import com.cstar.platform.whatsapp.repository.ContactRepository;
import com.cstar.platform.whatsapp.repository.ConversationSummaryRepository;
import com.cstar.platform.whatsapp.repository.WhatsappMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class WhatsappIngestionService {

    private final ContactRepository contactRepository;
    private final ConversationSummaryRepository conversationSummaryRepository;
    private final WhatsappMessageRepository whatsappMessageRepository;

    public WhatsappIngestionService(
            ContactRepository contactRepository,
            ConversationSummaryRepository conversationSummaryRepository,
            WhatsappMessageRepository whatsappMessageRepository
    ) {
        this.contactRepository = contactRepository;
        this.conversationSummaryRepository = conversationSummaryRepository;
        this.whatsappMessageRepository = whatsappMessageRepository;
    }

    @Transactional
    public void ingestInbound(
            String phoneE164,
            String displayName,
            String messageId,
            String text,
            Instant sentAt
    ) {
        if (phoneE164 == null || phoneE164.isBlank()) {
            return;
        }

        if (messageId != null && !messageId.isBlank() && whatsappMessageRepository.findByWaMessageId(messageId).isPresent()) {
            return;
        }

        Instant now = Instant.now();
        Contact contact = upsertContact(phoneE164, displayName, sentAt, true);
        ConversationSummary summary = upsertConversation(contact, sentAt, text, MessageDirection.INBOUND);

        WhatsappMessage message = WhatsappMessage.create(summary, messageId, MessageDirection.INBOUND, text, sentAt, now);
        whatsappMessageRepository.save(message);
    }

    @Transactional
    public void ingestOutbound(
            String phoneE164,
            String displayName,
            String messageId,
            String text,
            Instant sentAt
    ) {
        if (phoneE164 == null || phoneE164.isBlank()) {
            return;
        }

        if (messageId != null && !messageId.isBlank() && whatsappMessageRepository.findByWaMessageId(messageId).isPresent()) {
            return;
        }

        Instant now = Instant.now();
        Contact contact = upsertContact(phoneE164, displayName, sentAt, false);
        ConversationSummary summary = upsertConversation(contact, sentAt, text, MessageDirection.OUTBOUND);

        WhatsappMessage message = WhatsappMessage.create(summary, messageId, MessageDirection.OUTBOUND, text, sentAt, now);
        whatsappMessageRepository.save(message);
    }

    private Contact upsertContact(String phoneE164, String displayName, Instant timestamp, boolean inbound) {
        Instant eventTime = timestamp == null ? Instant.now() : timestamp;
        Contact contact = contactRepository.findByWhatsappPhoneE164(phoneE164)
                .orElseGet(() -> Contact.create(phoneE164, displayName, Instant.now()));

        if (displayName != null && !displayName.isBlank() && (contact.getFullName() == null || contact.getFullName().isBlank())) {
            contact.setFullName(displayName);
        }

        if (inbound) {
            contact.touchInbound(eventTime);
        } else {
            contact.touchOutbound(eventTime);
        }

        return contactRepository.save(contact);
    }

    private ConversationSummary upsertConversation(Contact contact, Instant timestamp, String text, MessageDirection direction) {
        Instant eventTime = timestamp == null ? Instant.now() : timestamp;
        ConversationSummary summary = conversationSummaryRepository
                .findByContactAndChannel(contact, "whatsapp")
                .orElseGet(() -> ConversationSummary.create(contact, eventTime));

        String preview = Optional.ofNullable(text).orElse("");
        if (preview.length() > 500) {
            preview = preview.substring(0, 500);
        }

        if (direction == MessageDirection.INBOUND) {
            summary.applyInbound(eventTime, preview);
        } else {
            summary.applyOutbound(eventTime, preview);
        }

        return conversationSummaryRepository.save(summary);
    }
}
