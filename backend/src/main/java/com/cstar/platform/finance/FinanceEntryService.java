package com.cstar.platform.finance;

import com.cstar.platform.finance.dto.FinanceExpenseRequest;
import com.cstar.platform.finance.dto.FinanceExpenseResponse;
import com.cstar.platform.finance.dto.FinanceIncomeRequest;
import com.cstar.platform.finance.dto.FinanceIncomeResponse;
import com.cstar.platform.finance.model.FinanceExpense;
import com.cstar.platform.finance.model.FinanceExpenseType;
import com.cstar.platform.finance.model.FinanceIncome;
import com.cstar.platform.finance.model.FinanceIncomeStatus;
import com.cstar.platform.finance.model.FinanceIncomeType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class FinanceEntryService {

    private final FinanceIncomeRepository incomeRepository;
    private final FinanceExpenseRepository expenseRepository;
    private final FinanceTypeService financeTypeService;

    public FinanceEntryService(FinanceIncomeRepository incomeRepository,
                               FinanceExpenseRepository expenseRepository,
                               FinanceTypeService financeTypeService) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.financeTypeService = financeTypeService;
    }

    @Transactional(readOnly = true)
    public List<FinanceIncomeResponse> listIncomes() {
        return incomeRepository.findAll().stream()
                .map(this::toIncomeResponse)
                .toList();
    }

    @Transactional
    public FinanceIncomeResponse createIncome(FinanceIncomeRequest request) {
        FinanceIncomeType type = financeTypeService.getIncomeTypeOrThrow(request.incomeTypeId());
        FinanceIncome income = FinanceIncome.create(
                type,
                request.source(),
                request.amount(),
                trimToNull(request.description()),
                trimToNull(request.notes()),
                request.occurredOn(),
                request.referenceId(),
                request.paymentStatus() != null ? request.paymentStatus() : FinanceIncomeStatus.PAGO);
        FinanceIncome saved = incomeRepository.save(income);
        return toIncomeResponse(saved);
    }

    @Transactional
    public FinanceIncomeResponse updateIncome(UUID id, FinanceIncomeRequest request) {
        FinanceIncome income = incomeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receita não encontrada"));
        FinanceIncomeType type = financeTypeService.getIncomeTypeOrThrow(request.incomeTypeId());
        income.update(type,
                request.amount(),
                trimToNull(request.description()),
                trimToNull(request.notes()),
                request.occurredOn());
        FinanceIncome saved = incomeRepository.save(income);
        return toIncomeResponse(saved);
    }

    @Transactional
    public FinanceIncomeResponse confirmIncomePayment(UUID id) {
        FinanceIncome income = incomeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receita não encontrada"));

        if (income.getPaymentStatus() == FinanceIncomeStatus.PAGO) {
            return toIncomeResponse(income);
        }

        income.markPaid();
        FinanceIncome saved = incomeRepository.save(income);
        return toIncomeResponse(saved);
    }

    @Transactional
    public void deleteIncome(UUID id) {
        if (!incomeRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Receita não encontrada");
        }
        incomeRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<FinanceExpenseResponse> listExpenses() {
        return expenseRepository.findAll().stream()
                .map(this::toExpenseResponse)
                .toList();
    }

    @Transactional
    public FinanceExpenseResponse createExpense(FinanceExpenseRequest request) {
        FinanceExpenseType type = financeTypeService.getExpenseTypeOrThrow(request.expenseTypeId());
        FinanceExpense expense = FinanceExpense.create(
                type,
                request.amount(),
                trimToNull(request.description()),
                trimToNull(request.notes()),
                request.occurredOn());
        FinanceExpense saved = expenseRepository.save(expense);
        return toExpenseResponse(saved);
    }

    @Transactional
    public FinanceExpenseResponse updateExpense(UUID id, FinanceExpenseRequest request) {
        FinanceExpense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Despesa não encontrada"));
        FinanceExpenseType type = financeTypeService.getExpenseTypeOrThrow(request.expenseTypeId());
        expense.update(type,
                request.amount(),
                trimToNull(request.description()),
                trimToNull(request.notes()),
                request.occurredOn());
        FinanceExpense saved = expenseRepository.save(expense);
        return toExpenseResponse(saved);
    }

    @Transactional
    public void deleteExpense(UUID id) {
        if (!expenseRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Despesa não encontrada");
        }
        expenseRepository.deleteById(id);
    }

    private FinanceIncomeResponse toIncomeResponse(FinanceIncome income) {
        return new FinanceIncomeResponse(
                income.getId(),
                income.getIncomeType().getId(),
                income.getIncomeType().getName(),
                income.getSource(),
                income.getReferenceId(),
                income.getAmount(),
                income.getDescription(),
                income.getNotes(),
                income.getOccurredOn(),
                income.getPaymentStatus(),
                income.getCreatedAt(),
                income.getUpdatedAt());
    }

    private FinanceExpenseResponse toExpenseResponse(FinanceExpense expense) {
        return new FinanceExpenseResponse(
                expense.getId(),
                expense.getExpenseType().getId(),
                expense.getExpenseType().getName(),
                expense.getAmount(),
                expense.getDescription(),
                expense.getNotes(),
                expense.getOccurredOn(),
                expense.getCreatedAt(),
                expense.getUpdatedAt());
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
