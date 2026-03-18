package com.cstar.platform.clientorders.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ClientServiceOrderProductItemResponse(
        UUID id,
        UUID productId,
        String source,
        String productName,
        BigDecimal quantityUsed,
        BigDecimal salePrice
) {
}
