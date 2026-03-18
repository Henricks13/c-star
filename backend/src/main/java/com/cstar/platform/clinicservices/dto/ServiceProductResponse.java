package com.cstar.platform.clinicservices.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceProductResponse(
        UUID id,
        UUID productId,
        String productName,
        String productSku,
        BigDecimal quantityUsed
) {
}
