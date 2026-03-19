package com.cstar.platform.clientorders.dto;

import java.time.Instant;
import java.util.UUID;

public record ClientServiceOrderObservationResponse(
        UUID id,
        String note,
        Instant createdAt
) {
}
