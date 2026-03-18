package com.cstar.platform.products.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.cstar.platform.products.model.StockAdjustmentOperation;

public record ProductResponse(
        UUID id,
        String name,
        String sku,
        UUID productTypeId,
        String productTypeName,
        BigDecimal purchasePrice,
        BigDecimal salePrice,
        BigDecimal stockQuantity,
        BigDecimal minimumStock,
        StockAdjustmentOperation lastAdjustmentOperation,
        BigDecimal lastAdjustmentQuantity,
        Instant lastAdjustmentAt,
        boolean perishable,
        LocalDate expirationDate,
        boolean active,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}
