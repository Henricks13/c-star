package com.cstar.platform.clientorders.dto;

import java.time.Instant;
import java.util.UUID;

public record ClientServiceOrderReturnResponse(
        UUID id,
        Instant returnAt,
        Instant createdAt
) {
}
