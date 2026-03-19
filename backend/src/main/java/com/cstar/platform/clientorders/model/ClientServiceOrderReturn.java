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
@Table(name = "client_service_order_returns")
public class ClientServiceOrderReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private ClientServiceOrder order;

    @Column(name = "return_at", nullable = false)
    private Instant returnAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ClientServiceOrderReturn() {
    }

    public static ClientServiceOrderReturn of(ClientServiceOrder order, Instant returnAt) {
        ClientServiceOrderReturn item = new ClientServiceOrderReturn();
        item.order = order;
        item.returnAt = returnAt;
        return item;
    }

    @PrePersist
    void onPrePersist() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Instant getReturnAt() {
        return returnAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
