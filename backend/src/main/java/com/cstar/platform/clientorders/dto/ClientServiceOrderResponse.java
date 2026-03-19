package com.cstar.platform.clientorders.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClientServiceOrderResponse(
        UUID id,
        UUID clientId,
        String clientName,
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
        Instant nextReturnAt,
        List<ClientServiceOrderServiceItemResponse> services,
        List<ClientServiceOrderProductItemResponse> products,
        List<ClientServiceOrderObservationResponse> observations,
        List<ClientServiceOrderReturnResponse> returns,
        Instant createdAt,
        Instant updatedAt
) {
}
