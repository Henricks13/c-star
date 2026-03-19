package com.cstar.platform.anamnesis.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "anamnesis_questions")
public class AnamnesisQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "question_text", nullable = false, length = 400)
    private String questionText;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AnamnesisQuestion() {
    }

    public static AnamnesisQuestion create(String questionText, int displayOrder, boolean active) {
        AnamnesisQuestion question = new AnamnesisQuestion();
        question.questionText = questionText;
        question.displayOrder = displayOrder;
        question.active = active;
        return question;
    }

    public void update(String questionText, int displayOrder, boolean active) {
        this.questionText = questionText;
        this.displayOrder = displayOrder;
        this.active = active;
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

    public String getQuestionText() {
        return questionText;
    }

    public int getDisplayOrder() {
        return displayOrder;
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
