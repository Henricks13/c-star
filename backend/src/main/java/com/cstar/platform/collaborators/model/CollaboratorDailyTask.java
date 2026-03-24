package com.cstar.platform.collaborators.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "collaborator_daily_tasks")
public class CollaboratorDailyTask {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "task_date", nullable = false)
    private LocalDate taskDate;

    @Column(name = "title", nullable = false, length = 220)
    private String title;

    @Column(name = "completed", nullable = false)
    private boolean completed;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 20)
    private CollaboratorTaskType taskType;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CollaboratorDailyTask() {
    }

    public static CollaboratorDailyTask create(
            UUID userId,
            LocalDate taskDate,
            String title,
            CollaboratorTaskType taskType,
            UUID createdByUserId
    ) {
        CollaboratorDailyTask task = new CollaboratorDailyTask();
        task.id = UUID.randomUUID();
        task.userId = userId;
        task.taskDate = taskDate;
        task.title = title;
        task.completed = false;
        task.taskType = taskType;
        task.createdByUserId = createdByUserId;
        return task;
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

    public LocalDate getTaskDate() {
        return taskDate;
    }

    public String getTitle() {
        return title;
    }

    public boolean isCompleted() {
        return completed;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public CollaboratorTaskType getTaskType() {
        return taskType;
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

    public void setCompleted(boolean completed) {
        this.completed = completed;
        this.completedAt = completed ? Instant.now() : null;
        this.updatedAt = Instant.now();
    }
}

