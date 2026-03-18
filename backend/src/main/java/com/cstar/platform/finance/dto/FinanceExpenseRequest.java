package com.cstar.platform.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FinanceExpenseRequest(
        @NotNull(message = "Tipo de despesa é obrigatório")
        UUID expenseTypeId,
        @NotNull(message = "Valor é obrigatório")
        @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
        BigDecimal amount,
        @Size(max = 240, message = "Descrição deve ter até 240 caracteres")
        String description,
        @Size(max = 500, message = "Observações devem ter até 500 caracteres")
        String notes,
        @NotNull(message = "Data é obrigatória")
        LocalDate occurredOn
) {
}
