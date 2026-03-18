package com.cstar.platform.finance;

import com.cstar.platform.finance.model.FinanceExpenseType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FinanceExpenseTypeRepository extends JpaRepository<FinanceExpenseType, UUID> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    Optional<FinanceExpenseType> findByNameIgnoreCase(String name);
}
