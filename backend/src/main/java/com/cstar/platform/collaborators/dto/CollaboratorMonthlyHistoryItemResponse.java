package com.cstar.platform.collaborators.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CollaboratorMonthlyHistoryItemResponse(
        LocalDate referenceMonth,
        int targetAnsweredContacts,
        int answeredContacts,
        BigDecimal targetSalesAmount,
        BigDecimal salesAmount,
        boolean answeredGoalReached,
        boolean salesGoalReached
) {
}
