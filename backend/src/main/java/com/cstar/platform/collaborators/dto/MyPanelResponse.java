package com.cstar.platform.collaborators.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MyPanelResponse(
        LocalDate date,
        UUID userId,
        String fullName,
        int goalContacts,
        int answeredContacts,
        int remainingContacts,
        int totalTasks,
        int completedTasks,
        List<CollaboratorDailyTaskResponse> dailyTasks,
        List<CollaboratorDailyTaskResponse> generalTasks,
        List<LocalDate> achievedDates
) {
}
