package com.cstar.platform.finance.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ProductSaleResponse(
        UUID id,
        String customerName,
        String notes,
        LocalDate occurredOn,
        BigDecimal totalAmount,
        Instant createdAt,
        List<ProductSaleItemResponse> items
) {
}
