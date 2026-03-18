package com.cstar.platform.finance;

import com.cstar.platform.finance.model.FinanceIncomeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FinanceIncomeTypeRepository extends JpaRepository<FinanceIncomeType, UUID> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    Optional<FinanceIncomeType> findByNameIgnoreCase(String name);
}
