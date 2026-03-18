package com.cstar.platform.clients.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 160)
    private String fullName;

    @Column(name = "phone_e164", nullable = false, unique = true, length = 20)
    private String phoneE164;

    @Column(name = "cpf", unique = true, length = 14)
    private String cpf;

    @Column(name = "email", unique = true, length = 160)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "origin", nullable = false, length = 40)
    private ClientOrigin origin;

    @Column(name = "source_contact_id")
    private UUID sourceContactId;

    @Column(name = "notes", length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_status", nullable = false, length = 40)
    private ClientBusinessStatus businessStatus;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Client() {
    }

    public static Client create(
            String fullName,
            String phoneE164,
            String cpf,
            String email,
            ClientOrigin origin,
            UUID sourceContactId,
            String notes
    ) {
        Client client = new Client();
        client.fullName = fullName;
        client.phoneE164 = phoneE164;
        client.cpf = cpf;
        client.email = email;
        client.origin = origin;
        client.sourceContactId = sourceContactId;
        client.notes = notes;
        client.businessStatus = ClientBusinessStatus.NEGOCIACAO;
        return client;
    }

    public void transitionToClosedDeal() {
        this.businessStatus = ClientBusinessStatus.NEGOCIO_FECHADO;
    }

    @PrePersist
    void onPrePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPhoneE164() {
        return phoneE164;
    }

    public String getCpf() {
        return cpf;
    }

    public String getEmail() {
        return email;
    }

    public ClientOrigin getOrigin() {
        return origin;
    }

    public UUID getSourceContactId() {
        return sourceContactId;
    }

    public String getNotes() {
        return notes;
    }

    public ClientBusinessStatus getBusinessStatus() {
        return businessStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
