package com.cstar.platform.clientorders.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record ScheduleClientServiceOrderRequest(
        @NotNull Instant scheduledAt
) {
}
