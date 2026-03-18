package com.cstar.platform.finance.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "finance_incomes")
public class FinanceIncome {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "income_type_id", nullable = false)
    private FinanceIncomeType incomeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 40)
    private IncomeSource source;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "description", length = 240)
    private String description;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 40)
    private FinanceIncomeStatus paymentStatus;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FinanceIncome() {
    }

    public static FinanceIncome create(
            FinanceIncomeType incomeType,
            IncomeSource source,
            BigDecimal amount,
            String description,
            String notes,
            LocalDate occurredOn,
            UUID referenceId,
            FinanceIncomeStatus paymentStatus
    ) {
        FinanceIncome income = new FinanceIncome();
        income.incomeType = incomeType;
        income.source = source;
        income.amount = amount;
        income.description = description;
        income.notes = notes;
        income.occurredOn = occurredOn;
        income.referenceId = referenceId;
        income.paymentStatus = paymentStatus;
        income.paidAt = paymentStatus == FinanceIncomeStatus.PAGO ? Instant.now() : null;
        return income;
    }

    public void update(FinanceIncomeType incomeType, BigDecimal amount, String description, String notes, LocalDate occurredOn) {
        this.incomeType = incomeType;
        this.amount = amount;
        this.description = description;
        this.notes = notes;
        this.occurredOn = occurredOn;
    }

    public void markPaid() {
        this.paymentStatus = FinanceIncomeStatus.PAGO;
        if (this.paidAt == null) {
            this.paidAt = Instant.now();
        }
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

    public FinanceIncomeType getIncomeType() {
        return incomeType;
    }

    public IncomeSource getSource() {
        return source;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getDescription() {
        return description;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDate getOccurredOn() {
        return occurredOn;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public FinanceIncomeStatus getPaymentStatus() {
        return paymentStatus;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
