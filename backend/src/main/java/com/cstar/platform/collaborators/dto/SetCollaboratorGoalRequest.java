package com.cstar.platform.collaborators.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record SetCollaboratorGoalRequest(
        @NotNull LocalDate date,
        @NotNull @Min(0) Integer targetContacts
) {
}
