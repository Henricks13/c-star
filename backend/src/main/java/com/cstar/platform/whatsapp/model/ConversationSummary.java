package com.cstar.platform.whatsapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation_summaries")
public class ConversationSummary {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    @Column(name = "channel", nullable = false, length = 20)
    private String channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ConversationStatus status;

    @Column(name = "unread_count", nullable = false)
    private int unreadCount;

    @Column(name = "last_message_at", nullable = false)
    private Instant lastMessageAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_message_direction", nullable = false, length = 10)
    private MessageDirection lastMessageDirection;

    @Column(name = "last_message_preview", length = 500)
    private String lastMessagePreview;

    @Column(name = "last_inbound_at")
    private Instant lastInboundAt;

    @Column(name = "last_outbound_at")
    private Instant lastOutboundAt;

    @Column(name = "assigned_to_user_id")
    private UUID assignedToUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ConversationSummary() {
    }

    public static ConversationSummary create(Contact contact, Instant now) {
        ConversationSummary summary = new ConversationSummary();
        summary.id = UUID.randomUUID();
        summary.contact = contact;
        summary.channel = "whatsapp";
        summary.status = ConversationStatus.OPEN;
        summary.unreadCount = 0;
        summary.lastMessageAt = now;
        summary.lastMessageDirection = MessageDirection.INBOUND;
        summary.createdAt = now;
        summary.updatedAt = now;
        return summary;
    }

    @PreUpdate
    void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Contact getContact() {
        return contact;
    }

    public int getUnreadCount() {
        return unreadCount;
    }

    public ConversationStatus getStatus() {
        return status;
    }

    public UUID getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(UUID assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
        this.updatedAt = Instant.now();
    }

    public void applyInbound(Instant timestamp, String preview) {
        this.lastMessageAt = timestamp;
        this.lastMessageDirection = MessageDirection.INBOUND;
        this.lastMessagePreview = preview;
        this.lastInboundAt = timestamp;
        this.unreadCount = this.unreadCount + 1;
        this.status = ConversationStatus.OPEN;
        this.updatedAt = Instant.now();
    }

    public void applyOutbound(Instant timestamp, String preview) {
        this.lastMessageAt = timestamp;
        this.lastMessageDirection = MessageDirection.OUTBOUND;
        this.lastMessagePreview = preview;
        this.lastOutboundAt = timestamp;
        this.unreadCount = 0;
        this.status = ConversationStatus.PENDING;
        this.updatedAt = Instant.now();
    }
}
