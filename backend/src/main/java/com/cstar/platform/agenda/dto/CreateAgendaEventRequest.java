package com.cstar.platform.agenda.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CreateAgendaEventRequest(
        @NotNull UUID typeId,
        @NotBlank @Size(min = 2, max = 160) String title,
        @NotNull Instant startAt,
        @Min(1) @Max(1440) Integer durationMinutes,
        @NotBlank String color,
        @Size(max = 500) String notes,
        UUID clientId
) {
}
