package com.cstar.platform.finance.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FinanceExpenseResponse(
        UUID id,
        UUID expenseTypeId,
        String expenseTypeName,
        BigDecimal amount,
        String description,
        String notes,
        LocalDate occurredOn,
        Instant createdAt,
        Instant updatedAt
) {
}
