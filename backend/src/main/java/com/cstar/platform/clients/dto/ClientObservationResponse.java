package com.cstar.platform.clients.dto;

import java.time.Instant;
import java.util.UUID;

public record ClientObservationResponse(
        UUID id,
        UUID clientId,
        String note,
        String createdByName,
        Instant createdAt
) {
}
