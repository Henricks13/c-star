package com.cstar.platform.finance;

import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.finance.dto.FinanceExpenseRequest;
import com.cstar.platform.finance.dto.FinanceExpenseResponse;
import com.cstar.platform.finance.dto.FinanceIncomeRequest;
import com.cstar.platform.finance.dto.FinanceIncomeResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/finance")
public class FinanceEntryController {

    private final FinanceEntryService financeEntryService;

    public FinanceEntryController(FinanceEntryService financeEntryService) {
        this.financeEntryService = financeEntryService;
    }

    @GetMapping("/incomes")
    public List<FinanceIncomeResponse> listIncomes() {
        return financeEntryService.listIncomes();
    }

    @PostMapping("/incomes")
    @ResponseStatus(HttpStatus.CREATED)
    public FinanceIncomeResponse createIncome(@Valid @RequestBody FinanceIncomeRequest request) {
        return financeEntryService.createIncome(request);
    }

    @PutMapping("/incomes/{id}")
    public FinanceIncomeResponse updateIncome(@PathVariable UUID id,
                                              @Valid @RequestBody FinanceIncomeRequest request) {
        return financeEntryService.updateIncome(id, request);
    }

    @PostMapping("/incomes/{id}/confirm-payment")
    public FinanceIncomeResponse confirmIncomePayment(@PathVariable UUID id) {
        return financeEntryService.confirmIncomePayment(id);
    }

    @DeleteMapping("/incomes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteIncome(@PathVariable UUID id) {
        financeEntryService.deleteIncome(id);
    }

    @DeleteMapping("/incomes/service-order/{orderId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteServiceOrderWithIncomes(@PathVariable UUID orderId,
                                              @AuthenticationPrincipal AuthUserPrincipal principal) {
        financeEntryService.deleteServiceOrderWithIncomes(orderId, principal);
    }

    @GetMapping("/expenses")
    public List<FinanceExpenseResponse> listExpenses() {
        return financeEntryService.listExpenses();
    }

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public FinanceExpenseResponse createExpense(@Valid @RequestBody FinanceExpenseRequest request) {
        return financeEntryService.createExpense(request);
    }

    @PutMapping("/expenses/{id}")
    public FinanceExpenseResponse updateExpense(@PathVariable UUID id,
                                                @Valid @RequestBody FinanceExpenseRequest request) {
        return financeEntryService.updateExpense(id, request);
    }

    @DeleteMapping("/expenses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExpense(@PathVariable UUID id) {
        financeEntryService.deleteExpense(id);
    }
}
