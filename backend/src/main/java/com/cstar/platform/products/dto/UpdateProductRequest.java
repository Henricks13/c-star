package com.cstar.platform.products.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateProductRequest(
        @NotBlank @Size(min = 2, max = 160) String name,
        @Size(max = 60) String sku,
        @NotNull UUID productTypeId,
        @NotNull @DecimalMin(value = "0.00") BigDecimal purchasePrice,
        @NotNull @DecimalMin(value = "0.00") BigDecimal salePrice,
        @NotNull @DecimalMin(value = "0.00") BigDecimal stockQuantity,
        @NotNull @DecimalMin(value = "0.00") BigDecimal minimumStock,
        Boolean perishable,
        LocalDate expirationDate,
        Boolean active,
        @Size(max = 500) String notes
) {
}
