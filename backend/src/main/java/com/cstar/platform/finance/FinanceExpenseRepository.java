package com.cstar.platform.finance;

import com.cstar.platform.finance.model.FinanceExpense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FinanceExpenseRepository extends JpaRepository<FinanceExpense, UUID> {
}
