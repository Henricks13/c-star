package com.cstar.platform.collaborators.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "collaborator_monthly_progress")
public class CollaboratorMonthlyProgress {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "reference_month", nullable = false)
    private LocalDate referenceMonth;

    @Column(name = "answered_contacts_count", nullable = false)
    private int answeredContactsCount;

    @Column(name = "sales_amount", nullable = false)
    private BigDecimal salesAmount;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CollaboratorMonthlyProgress() {
    }

    public static CollaboratorMonthlyProgress create(UUID userId, LocalDate referenceMonth) {
        CollaboratorMonthlyProgress progress = new CollaboratorMonthlyProgress();
        progress.id = UUID.randomUUID();
        progress.userId = userId;
        progress.referenceMonth = referenceMonth;
        progress.answeredContactsCount = 0;
        progress.salesAmount = BigDecimal.ZERO;
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

    public UUID getUserId() {
        return userId;
    }

    public LocalDate getReferenceMonth() {
        return referenceMonth;
    }

    public int getAnsweredContactsCount() {
        return answeredContactsCount;
    }

    public BigDecimal getSalesAmount() {
        return salesAmount;
    }

    public void incrementAnsweredContactsCount() {
        this.answeredContactsCount = this.answeredContactsCount + 1;
        this.updatedAt = Instant.now();
    }
}
