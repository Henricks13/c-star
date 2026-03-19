package com.cstar.platform.agenda.dto;

import java.util.UUID;

public record AgendaEventTypeResponse(
        UUID id,
        String name,
        String kind,
        Integer defaultDurationMinutes,
        boolean allowsCustomDuration,
        boolean requiresClient,
        String color
) {
}
