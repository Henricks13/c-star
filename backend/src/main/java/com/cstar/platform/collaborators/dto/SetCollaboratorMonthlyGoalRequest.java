package com.cstar.platform.collaborators.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SetCollaboratorMonthlyGoalRequest(
        @NotNull LocalDate referenceMonth,
        @NotNull @Min(0) Integer targetAnsweredContacts,
        @NotNull @DecimalMin("0.00") BigDecimal targetSalesAmount
) {
}
