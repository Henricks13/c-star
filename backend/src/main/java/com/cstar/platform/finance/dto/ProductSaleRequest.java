package com.cstar.platform.finance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record ProductSaleRequest(
        @Size(max = 160, message = "Cliente deve ter até 160 caracteres")
        String customerName,
        @Size(max = 500, message = "Observações devem ter até 500 caracteres")
        String notes,
        @NotNull(message = "Data é obrigatória")
        LocalDate occurredOn,
        @NotEmpty(message = "Informe ao menos um item")
        List<@Valid ProductSaleItemRequest> items
) {
}
