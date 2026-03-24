package com.cstar.platform.collaborators.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "collaborator_daily_progress")
public class CollaboratorDailyProgress {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "progress_date", nullable = false)
    private LocalDate progressDate;

    @Column(name = "answered_contacts_count", nullable = false)
    private int answeredContactsCount;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CollaboratorDailyProgress() {
    }

    public static CollaboratorDailyProgress create(UUID userId, LocalDate progressDate) {
        CollaboratorDailyProgress progress = new CollaboratorDailyProgress();
        progress.id = UUID.randomUUID();
        progress.userId = userId;
        progress.progressDate = progressDate;
        progress.answeredContactsCount = 0;
        return progress;
    }

    @PrePersist
    void onPrePersist() {
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public LocalDate getProgressDate() {
        return progressDate;
    }

    public int getAnsweredContactsCount() {
        return answeredContactsCount;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void incrementAnsweredContactsCount() {
        this.answeredContactsCount = this.answeredContactsCount + 1;
        this.updatedAt = Instant.now();
    }
}
