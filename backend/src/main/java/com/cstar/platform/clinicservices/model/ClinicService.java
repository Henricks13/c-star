package com.cstar.platform.clinicservices.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "services")
public class ClinicService {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false, length = 40)
    private ServiceStage stage;

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "clinicService", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<ServiceProduct> consumedProducts = new ArrayList<>();

    protected ClinicService() {
    }

    public static ClinicService create(
            String name,
            ServiceStage stage,
            BigDecimal price,
            Integer durationMinutes,
            boolean active,
            String notes
    ) {
        ClinicService service = new ClinicService();
        service.name = name;
        service.stage = stage;
        service.price = price;
        service.durationMinutes = durationMinutes;
        service.active = active;
        service.notes = notes;
        return service;
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

    public void update(
            String name,
            ServiceStage stage,
            BigDecimal price,
            Integer durationMinutes,
            boolean active,
            String notes
    ) {
        this.name = name;
        this.stage = stage;
        this.price = price;
        this.durationMinutes = durationMinutes;
        this.active = active;
        this.notes = notes;
    }

    public void clearConsumedProducts() {
        consumedProducts.clear();
    }

    public void addConsumedProduct(ServiceProduct item) {
        consumedProducts.add(item);
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public ServiceStage getStage() {
        return stage;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public boolean isActive() {
        return active;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<ServiceProduct> getConsumedProducts() {
        return consumedProducts;
    }
}
