package com.cstar.platform.clinicservices.model;

import com.cstar.platform.products.model.Product;
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
@Table(name = "service_products")
public class ServiceProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ClinicService clinicService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity_used", nullable = false, precision = 15, scale = 3)
    private BigDecimal quantityUsed;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ServiceProduct() {
    }

    public static ServiceProduct of(ClinicService clinicService, Product product, BigDecimal quantityUsed) {
        ServiceProduct item = new ServiceProduct();
        item.clinicService = clinicService;
        item.product = product;
        item.quantityUsed = quantityUsed;
        return item;
    }

    @PrePersist
    void onPrePersist() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public ClinicService getClinicService() {
        return clinicService;
    }

    public Product getProduct() {
        return product;
    }

    public BigDecimal getQuantityUsed() {
        return quantityUsed;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
