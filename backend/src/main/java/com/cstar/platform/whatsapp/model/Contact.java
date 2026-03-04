package com.cstar.platform.whatsapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contacts")
public class Contact {

    @Id
    private UUID id;

    @Column(name = "whatsapp_phone_e164", nullable = false, unique = true, length = 20)
    private String whatsappPhoneE164;

    @Column(name = "full_name", length = 160)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false, length = 30)
    private ContactStage stage;

    @Column(name = "source", nullable = false, length = 50)
    private String source;

    @Column(name = "first_inbound_at")
    private Instant firstInboundAt;

    @Column(name = "last_inbound_at")
    private Instant lastInboundAt;

    @Column(name = "last_outbound_at")
    private Instant lastOutboundAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Contact() {
    }

    public static Contact create(String phoneE164, String fullName, Instant now) {
        Contact contact = new Contact();
        contact.id = UUID.randomUUID();
        contact.whatsappPhoneE164 = phoneE164;
        contact.fullName = fullName;
        contact.stage = ContactStage.LEAD;
        contact.source = "whatsapp";
        contact.createdAt = now;
        contact.updatedAt = now;
        return contact;
    }

    @PreUpdate
    void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getWhatsappPhoneE164() {
        return whatsappPhoneE164;
    }

    public String getFullName() {
        return fullName;
    }

    public ContactStage getStage() {
        return stage;
    }

    public String getSource() {
        return source;
    }

    public Instant getFirstInboundAt() {
        return firstInboundAt;
    }

    public Instant getLastInboundAt() {
        return lastInboundAt;
    }

    public Instant getLastOutboundAt() {
        return lastOutboundAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void touchInbound(Instant timestamp) {
        if (firstInboundAt == null) {
            firstInboundAt = timestamp;
        }
        lastInboundAt = timestamp;
        updatedAt = Instant.now();
    }

    public void touchOutbound(Instant timestamp) {
        lastOutboundAt = timestamp;
        updatedAt = Instant.now();
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
        this.updatedAt = Instant.now();
    }
}
