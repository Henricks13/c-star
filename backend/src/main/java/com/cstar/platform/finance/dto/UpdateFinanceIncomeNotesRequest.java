package com.cstar.platform.finance.dto;

import jakarta.validation.constraints.Size;

public record UpdateFinanceIncomeNotesRequest(
        @Size(max = 500, message = "Observações devem ter até 500 caracteres") String notes
) {
}
