package com.cstar.platform.clientorders.model;

import com.cstar.platform.clinicservices.model.ClinicService;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "client_service_order_services")
public class ClientServiceOrderServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private ClientServiceOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ClinicService service;

    @Column(name = "service_name_snapshot", nullable = false, length = 160)
    private String serviceNameSnapshot;

    @Column(name = "service_price_snapshot", nullable = false, precision = 15, scale = 2)
    private BigDecimal servicePriceSnapshot;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ClientServiceOrderServiceItem() {
    }

    public static ClientServiceOrderServiceItem of(ClientServiceOrder order, ClinicService service) {
        ClientServiceOrderServiceItem item = new ClientServiceOrderServiceItem();
        item.order = order;
        item.service = service;
        item.serviceNameSnapshot = service.getName();
        item.servicePriceSnapshot = service.getPrice();
        return item;
    }

    @PrePersist
    void onPrePersist() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public ClinicService getService() {
        return service;
    }

    public String getServiceNameSnapshot() {
        return serviceNameSnapshot;
    }

    public BigDecimal getServicePriceSnapshot() {
        return servicePriceSnapshot;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
