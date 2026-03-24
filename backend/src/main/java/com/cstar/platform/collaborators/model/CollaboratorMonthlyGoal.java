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
@Table(name = "collaborator_monthly_goals")
public class CollaboratorMonthlyGoal {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "reference_month", nullable = false)
    private LocalDate referenceMonth;

    @Column(name = "target_answered_contacts", nullable = false)
    private int targetAnsweredContacts;

    @Column(name = "target_sales_amount", nullable = false)
    private BigDecimal targetSalesAmount;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CollaboratorMonthlyGoal() {
    }

    public static CollaboratorMonthlyGoal create(
            UUID userId,
            LocalDate referenceMonth,
            int targetAnsweredContacts,
            BigDecimal targetSalesAmount,
            UUID createdByUserId
    ) {
        CollaboratorMonthlyGoal goal = new CollaboratorMonthlyGoal();
        goal.id = UUID.randomUUID();
        goal.userId = userId;
        goal.referenceMonth = referenceMonth;
        goal.targetAnsweredContacts = targetAnsweredContacts;
        goal.targetSalesAmount = targetSalesAmount == null ? BigDecimal.ZERO : targetSalesAmount;
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

    public UUID getUserId() {
        return userId;
    }

    public LocalDate getReferenceMonth() {
        return referenceMonth;
    }

    public int getTargetAnsweredContacts() {
        return targetAnsweredContacts;
    }

    public BigDecimal getTargetSalesAmount() {
        return targetSalesAmount;
    }

    public void updateTargets(int targetAnsweredContacts, BigDecimal targetSalesAmount, UUID updatedByUserId) {
        this.targetAnsweredContacts = targetAnsweredContacts;
        this.targetSalesAmount = targetSalesAmount == null ? BigDecimal.ZERO : targetSalesAmount;
        this.createdByUserId = updatedByUserId;
        this.updatedAt = Instant.now();
    }
}
