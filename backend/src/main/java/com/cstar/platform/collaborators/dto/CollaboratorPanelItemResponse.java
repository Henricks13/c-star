package com.cstar.platform.collaborators.dto;

import java.util.UUID;

public record CollaboratorPanelItemResponse(
        UUID userId,
        String fullName,
        int dailyGoalContacts,
        int dailyAnsweredContacts,
        int monthlySalesGoal,
        int monthlySalesProgress,
        int dailyTasksCompletionPercent,
        int allTasksCompletionPercent
) {
}

