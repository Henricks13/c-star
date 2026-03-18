package com.cstar.platform.clientorders.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ClientServiceOrderServiceItemResponse(
        UUID id,
        UUID serviceId,
        String serviceName,
        BigDecimal servicePrice
) {
}
