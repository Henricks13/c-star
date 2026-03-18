package com.cstar.platform.finance.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductSaleItemResponse(
        UUID productId,
        String productName,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
