package com.cstar.platform.products.dto;

import com.cstar.platform.products.model.StockAdjustmentOperation;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record StockAdjustmentRequest(
        @NotNull StockAdjustmentOperation operation,
        @NotNull @DecimalMin(value = "0.001") BigDecimal quantity,
        @DecimalMin(value = "0.00") BigDecimal customUnitPrice,
        @Size(max = 500) String notes
) {
}
