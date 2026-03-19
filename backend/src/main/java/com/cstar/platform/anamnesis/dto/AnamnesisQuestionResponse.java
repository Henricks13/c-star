package com.cstar.platform.anamnesis.dto;

import java.time.Instant;
import java.util.UUID;

public record AnamnesisQuestionResponse(
        UUID id,
        String questionText,
        int displayOrder,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
