package com.cstar.platform.whatsapp.dto;

import java.time.Instant;
import java.util.UUID;

public record ContactMessageItemResponse(
        UUID id,
        String direction,
        String body,
        Instant sentAt,
        String waMessageId
) {
}
