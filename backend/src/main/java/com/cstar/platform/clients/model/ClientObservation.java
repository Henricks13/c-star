package com.cstar.platform.clients.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "client_observations")
public class ClientObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "note", nullable = false, length = 500)
    private String note;

    @Column(name = "created_by_name", length = 120)
    private String createdByName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ClientObservation() {
    }

    public static ClientObservation of(Client client, String note, String createdByName) {
        ClientObservation observation = new ClientObservation();
        observation.client = client;
        observation.note = note;
        observation.createdByName = createdByName;
        return observation;
    }

    @PrePersist
    void onPrePersist() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Client getClient() {
        return client;
    }

    public String getNote() {
        return note;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
