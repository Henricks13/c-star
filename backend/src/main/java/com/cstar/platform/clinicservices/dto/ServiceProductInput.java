package com.cstar.platform.clinicservices.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceProductInput(
        @NotNull UUID productId,
        @NotNull @DecimalMin(value = "0.001") BigDecimal quantityUsed
) {
}
