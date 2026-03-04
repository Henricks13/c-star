package com.cstar.platform.whatsapp.dto;

import java.time.Instant;
import java.util.UUID;

public record ContactListItemResponse(
        UUID id,
        String fullName,
        String phone,
        String stage,
        Instant lastInteractionAt
) {
}
