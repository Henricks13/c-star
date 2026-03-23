package com.cstar.platform.finance;

import com.cstar.platform.finance.model.FinanceIncome;
import com.cstar.platform.finance.model.IncomeSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FinanceIncomeRepository extends JpaRepository<FinanceIncome, UUID> {
    List<FinanceIncome> findBySourceAndReferenceIdOrderByOccurredOnAscCreatedAtAsc(IncomeSource source, UUID referenceId);

    List<FinanceIncome> findByReferenceIdAndSourceOrderByOccurredOnAscCreatedAtAsc(UUID referenceId, IncomeSource source);
}
