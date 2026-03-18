package com.cstar.platform.clientorders.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateClientServiceOrderRequest(
        UUID orderId,
        @NotNull UUID clientId,
        @NotEmpty List<UUID> serviceIds,
        @Valid List<ExtraProductInput> extraProducts,
        @DecimalMin(value = "0.00") BigDecimal discountAmount,
        Boolean customTotalEnabled,
        @DecimalMin(value = "0.00") BigDecimal customTotalValue,
        @Size(max = 500) String notes
) {
}
