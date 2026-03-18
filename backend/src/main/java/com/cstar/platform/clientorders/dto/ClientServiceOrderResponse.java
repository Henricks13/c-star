package com.cstar.platform.clientorders.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClientServiceOrderResponse(
        UUID id,
        UUID clientId,
        BigDecimal subtotalServices,
        BigDecimal subtotalExtraProducts,
        BigDecimal discountAmount,
        boolean customTotalEnabled,
        BigDecimal customTotalValue,
        BigDecimal finalTotal,
        String notes,
        String status,
        String paymentMethod,
        Integer installmentCount,
        Integer paidInstallmentCount,
        Instant paidAt,
        List<ClientServiceOrderServiceItemResponse> services,
        List<ClientServiceOrderProductItemResponse> products,
        Instant createdAt,
        Instant updatedAt
) {
}
