package com.cstar.platform.collaborators.dto;

import java.util.UUID;

public record CollaboratorDailyTaskResponse(
        UUID id,
        String title,
        boolean completed,
        String taskType,
        java.time.LocalDate taskDate,
        java.time.Instant createdAt,
        java.time.Instant completedAt
) {
}


