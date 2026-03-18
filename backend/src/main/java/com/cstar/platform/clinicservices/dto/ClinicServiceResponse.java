package com.cstar.platform.clinicservices.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClinicServiceResponse(
        UUID id,
        String name,
        String stage,
        BigDecimal price,
        Integer durationMinutes,
        boolean active,
        String notes,
        List<ServiceProductResponse> consumedProducts,
        Instant createdAt,
        Instant updatedAt
) {
}
