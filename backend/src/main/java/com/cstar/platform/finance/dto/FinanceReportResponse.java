package com.cstar.platform.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FinanceReportResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalIncomes,
        BigDecimal totalExpenses,
        BigDecimal totalProfit,
        long incomesCount,
        long expensesCount,
        List<FinanceReportItemResponse> entries,
        List<FinanceReportItemResponse> exits
) {
}
