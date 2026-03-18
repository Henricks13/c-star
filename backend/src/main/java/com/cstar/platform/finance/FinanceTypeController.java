package com.cstar.platform.finance;

import com.cstar.platform.finance.dto.FinanceTypeRequest;
import com.cstar.platform.finance.dto.FinanceTypeResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
public class FinanceTypeController {

    private final FinanceTypeService financeTypeService;

    public FinanceTypeController(FinanceTypeService financeTypeService) {
        this.financeTypeService = financeTypeService;
    }

    @GetMapping("/income-types")
    public List<FinanceTypeResponse> listIncomeTypes() {
        return financeTypeService.listIncomeTypes();
    }

    @PostMapping("/income-types")
    @ResponseStatus(HttpStatus.CREATED)
    public FinanceTypeResponse createIncomeType(@Valid @RequestBody FinanceTypeRequest request) {
        return financeTypeService.createIncomeType(request);
    }

    @PutMapping("/income-types/{id}")
    public FinanceTypeResponse updateIncomeType(@PathVariable UUID id,
                                                @Valid @RequestBody FinanceTypeRequest request) {
        return financeTypeService.updateIncomeType(id, request);
    }

    @DeleteMapping("/income-types/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteIncomeType(@PathVariable UUID id) {
        financeTypeService.deleteIncomeType(id);
    }

    @GetMapping("/expense-types")
    public List<FinanceTypeResponse> listExpenseTypes() {
        return financeTypeService.listExpenseTypes();
    }

    @PostMapping("/expense-types")
    @ResponseStatus(HttpStatus.CREATED)
    public FinanceTypeResponse createExpenseType(@Valid @RequestBody FinanceTypeRequest request) {
        return financeTypeService.createExpenseType(request);
    }

    @PutMapping("/expense-types/{id}")
    public FinanceTypeResponse updateExpenseType(@PathVariable UUID id,
                                                 @Valid @RequestBody FinanceTypeRequest request) {
        return financeTypeService.updateExpenseType(id, request);
    }

    @DeleteMapping("/expense-types/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExpenseType(@PathVariable UUID id) {
        financeTypeService.deleteExpenseType(id);
    }
}
