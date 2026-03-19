package com.cstar.platform.anamnesis.model;

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
@Table(name = "client_anamnesis_submission_answers")
public class ClientAnamnesisSubmissionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private ClientAnamnesisSubmission submission;

    @Column(name = "question_id_snapshot")
    private UUID questionIdSnapshot;

    @Column(name = "question_text_snapshot", nullable = false, length = 400)
    private String questionTextSnapshot;

    @Column(name = "answer_text", nullable = false, length = 2000)
    private String answerText;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ClientAnamnesisSubmissionAnswer() {
    }

    public static ClientAnamnesisSubmissionAnswer create(
            ClientAnamnesisSubmission submission,
            UUID questionIdSnapshot,
            String questionTextSnapshot,
            String answerText,
            int displayOrder
    ) {
        ClientAnamnesisSubmissionAnswer answer = new ClientAnamnesisSubmissionAnswer();
        answer.submission = submission;
        answer.questionIdSnapshot = questionIdSnapshot;
        answer.questionTextSnapshot = questionTextSnapshot;
        answer.answerText = answerText;
        answer.displayOrder = displayOrder;
        return answer;
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

    public ClientAnamnesisSubmission getSubmission() {
        return submission;
    }

    public UUID getQuestionIdSnapshot() {
        return questionIdSnapshot;
    }

    public String getQuestionTextSnapshot() {
        return questionTextSnapshot;
    }

    public String getAnswerText() {
        return answerText;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
