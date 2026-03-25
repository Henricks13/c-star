package com.cstar.platform.clientorders.model;

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
@Table(name = "client_service_order_observations")
public class ClientServiceOrderObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private ClientServiceOrder order;

    @Column(name = "note", nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_by_name", length = 120)
    private String createdByName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ClientServiceOrderObservation() {
    }

    public static ClientServiceOrderObservation of(ClientServiceOrder order, String note, String createdByName) {
        ClientServiceOrderObservation observation = new ClientServiceOrderObservation();
        observation.order = order;
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
