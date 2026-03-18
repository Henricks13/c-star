package com.cstar.platform.finance;

import com.cstar.platform.finance.dto.FinanceReportItemResponse;
import com.cstar.platform.finance.dto.FinanceReportResponse;
import com.cstar.platform.finance.model.FinanceExpense;
import com.cstar.platform.finance.model.FinanceIncome;
import com.cstar.platform.finance.model.FinanceIncomeStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class FinanceReportService {

    private final FinanceIncomeRepository incomeRepository;
    private final FinanceExpenseRepository expenseRepository;

    public FinanceReportService(FinanceIncomeRepository incomeRepository,
                                FinanceExpenseRepository expenseRepository) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public FinanceReportResponse generate(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Período inválido: data inicial maior que final");
        }

        List<FinanceIncome> incomes = incomeRepository.findAll().stream()
                .filter(income -> inRange(income.getOccurredOn(), startDate, endDate))
                .filter(income -> income.getPaymentStatus() == FinanceIncomeStatus.PAGO)
                .toList();

        List<FinanceExpense> expenses = expenseRepository.findAll().stream()
                .filter(expense -> inRange(expense.getOccurredOn(), startDate, endDate))
                .toList();

        BigDecimal totalIncomes = incomes.stream()
                .map(FinanceIncome::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = expenses.stream()
                .map(FinanceExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProfit = totalIncomes.subtract(totalExpenses);

        List<FinanceReportItemResponse> entryItems = incomes.stream()
                .sorted(
                        Comparator.comparing(FinanceIncome::getOccurredOn, Comparator.reverseOrder())
                                .thenComparing(FinanceIncome::getCreatedAt, Comparator.reverseOrder())
                )
                .map(income -> new FinanceReportItemResponse(
                        "ENTRADA",
                        income.getId(),
                        income.getOccurredOn(),
                        income.getIncomeType().getName(),
                        income.getDescription(),
                        income.getAmount(),
                        income.getSource().name(),
                        income.getReferenceId()))
                .toList();

        List<FinanceReportItemResponse> exitItems = expenses.stream()
                .sorted(
                        Comparator.comparing(FinanceExpense::getOccurredOn, Comparator.reverseOrder())
                                .thenComparing(FinanceExpense::getCreatedAt, Comparator.reverseOrder())
                )
                .map(expense -> new FinanceReportItemResponse(
                        "SAIDA",
                        expense.getId(),
                        expense.getOccurredOn(),
                        expense.getExpenseType().getName(),
                        expense.getDescription(),
                        expense.getAmount(),
                        null,
                        null))
                .toList();

        return new FinanceReportResponse(
                startDate,
                endDate,
                totalIncomes,
                totalExpenses,
                totalProfit,
                entryItems.size(),
                exitItems.size(),
                entryItems,
                exitItems
        );
    }

    private boolean inRange(LocalDate value, LocalDate startDate, LocalDate endDate) {
        if (value == null) {
            return false;
        }
        if (startDate != null && value.isBefore(startDate)) {
            return false;
        }
        if (endDate != null && value.isAfter(endDate)) {
            return false;
        }
        return true;
    }
}
