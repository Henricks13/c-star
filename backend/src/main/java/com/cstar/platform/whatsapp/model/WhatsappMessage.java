package com.cstar.platform.whatsapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class WhatsappMessage {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ConversationSummary conversation;

    @Column(name = "wa_message_id", unique = true, length = 120)
    private String waMessageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 10)
    private MessageDirection direction;

    @Column(name = "body")
    private String body;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected WhatsappMessage() {
    }

    public static WhatsappMessage create(
            ConversationSummary conversation,
            String waMessageId,
            MessageDirection direction,
            String body,
            Instant sentAt,
            Instant now
    ) {
        WhatsappMessage message = new WhatsappMessage();
        message.id = UUID.randomUUID();
        message.conversation = conversation;
        message.waMessageId = waMessageId;
        message.direction = direction;
        message.body = body;
        message.sentAt = sentAt;
        message.createdAt = now;
        return message;
    }

    public UUID getId() {
        return id;
    }

    public String getWaMessageId() {
        return waMessageId;
    }

    public MessageDirection getDirection() {
        return direction;
    }

    public String getBody() {
        return body;
    }

    public Instant getSentAt() {
        return sentAt;
    }
}
