package com.cstar.platform.collaborators.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AddCollaboratorTaskRequest(
        LocalDate date,
        @NotBlank @Size(max = 220) String title,
        String taskType
) {
}
