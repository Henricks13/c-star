package com.cstar.platform.finance;

import com.cstar.platform.finance.model.ProductSale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductSaleRepository extends JpaRepository<ProductSale, UUID> {
}
