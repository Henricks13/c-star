package com.cstar.platform.finance.dto;

import java.time.Instant;
import java.util.UUID;

public record FinanceTypeResponse(
        UUID id,
        String name,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
}
