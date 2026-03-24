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
@Table(name = "collaborator_daily_goals")
public class CollaboratorDailyGoal {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "goal_date", nullable = false)
    private LocalDate goalDate;

    @Column(name = "target_contacts", nullable = false)
    private int targetContacts;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CollaboratorDailyGoal() {
    }

    public static CollaboratorDailyGoal create(UUID userId, LocalDate goalDate, int targetContacts, UUID createdByUserId) {
        CollaboratorDailyGoal goal = new CollaboratorDailyGoal();
        goal.id = UUID.randomUUID();
        goal.userId = userId;
        goal.goalDate = goalDate;
        goal.targetContacts = targetContacts;
        goal.createdByUserId = createdByUserId;
        return goal;
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

    public UUID getUserId() {
        return userId;
    }

    public LocalDate getGoalDate() {
        return goalDate;
    }

    public int getTargetContacts() {
        return targetContacts;
    }

    public UUID getCreatedByUserId() {
        return createdByUserId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void updateTargetContacts(int targetContacts, UUID updatedByUserId) {
        this.targetContacts = targetContacts;
        this.createdByUserId = updatedByUserId;
        this.updatedAt = Instant.now();
    }
}