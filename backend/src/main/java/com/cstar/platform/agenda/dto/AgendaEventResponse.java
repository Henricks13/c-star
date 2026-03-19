package com.cstar.platform.agenda.dto;

import java.time.Instant;
import java.util.UUID;

public record AgendaEventResponse(
        UUID id,
        UUID typeId,
        String typeName,
        String typeKind,
        String title,
        String notes,
        String color,
        Instant startAt,
        Instant endAt,
        Integer durationMinutes,
        UUID clientId,
        String clientName,
        Instant createdAt,
        Instant updatedAt
) {
}
