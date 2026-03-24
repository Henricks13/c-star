package com.cstar.platform.collaborators.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CollaboratorManagementResponse(
        UUID userId,
        String fullName,
        LocalDate date,
        int dailyGoalContacts,
        int dailyAnsweredContacts,
        int monthlyGoalAnsweredContacts,
        int monthlyAnsweredContacts,
        BigDecimal monthlyGoalSalesAmount,
        BigDecimal monthlySalesAmount,
        int dailyTasksCompletionPercent,
        int allTasksCompletionPercent,
        List<CollaboratorDailyTaskResponse> dailyTasks,
        List<CollaboratorDailyTaskResponse> generalTasks,
        List<CollaboratorMonthlyHistoryItemResponse> monthlyHistory
) {
}
