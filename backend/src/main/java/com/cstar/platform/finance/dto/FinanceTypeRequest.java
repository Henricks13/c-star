package com.cstar.platform.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FinanceTypeRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 120, message = "Nome deve ter até 120 caracteres")
        String name,
        @Size(max = 500, message = "Descrição deve ter até 500 caracteres")
        String description
) {
}
