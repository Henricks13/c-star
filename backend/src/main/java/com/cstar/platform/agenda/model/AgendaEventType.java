package com.cstar.platform.agenda.model;

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
@Table(name = "calendar_event_types")
public class AgendaEventType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, length = 40)
    private AgendaEventKind kind;

    @Column(name = "default_duration_minutes", nullable = false)
    private Integer defaultDurationMinutes;

    @Column(name = "allows_custom_duration", nullable = false)
    private boolean allowsCustomDuration;

    @Column(name = "requires_client", nullable = false)
    private boolean requiresClient;

    @Column(name = "color", nullable = false, length = 7)
    private String color;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AgendaEventType() {
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

    public String getName() {
        return name;
    }

    public AgendaEventKind getKind() {
        return kind;
    }

    public Integer getDefaultDurationMinutes() {
        return defaultDurationMinutes;
    }

    public boolean isAllowsCustomDuration() {
        return allowsCustomDuration;
    }

    public boolean isRequiresClient() {
        return requiresClient;
    }

    public String getColor() {
        return color;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
