package com.cstar.platform.finance.dto;

import com.cstar.platform.finance.model.IncomeSource;
import com.cstar.platform.finance.model.FinanceIncomeStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FinanceIncomeResponse(
        UUID id,
        UUID incomeTypeId,
        String incomeTypeName,
        IncomeSource source,
        UUID referenceId,
        BigDecimal amount,
        String description,
        String notes,
        LocalDate occurredOn,
        FinanceIncomeStatus paymentStatus,
        Instant createdAt,
        Instant updatedAt
) {
}
