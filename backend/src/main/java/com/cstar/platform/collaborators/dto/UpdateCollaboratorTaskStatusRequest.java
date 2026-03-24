package com.cstar.platform.collaborators.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateCollaboratorTaskStatusRequest(
        @NotNull Boolean completed
) {
}
