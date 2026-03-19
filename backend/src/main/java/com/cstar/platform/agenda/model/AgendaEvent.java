package com.cstar.platform.agenda.model;

import com.cstar.platform.clients.model.Client;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "calendar_events")
public class AgendaEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_type_id", nullable = false)
    private AgendaEventType eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(name = "title", nullable = false, length = 160)
    private String title;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "color", nullable = false, length = 7)
    private String color;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AgendaEvent() {
    }

    public static AgendaEvent create(
            AgendaEventType eventType,
            Client client,
            String title,
            String notes,
            String color,
            Instant startAt,
            Integer durationMinutes
    ) {
        AgendaEvent event = new AgendaEvent();
        event.eventType = eventType;
        event.client = client;
        event.title = title;
        event.notes = notes;
        event.color = color;
        event.startAt = startAt;
        event.durationMinutes = durationMinutes;
        return event;
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

    public AgendaEventType getEventType() {
        return eventType;
    }

    public Client getClient() {
        return client;
    }

    public String getTitle() {
        return title;
    }

    public String getNotes() {
        return notes;
    }

    public String getColor() {
        return color;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
