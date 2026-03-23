package com.cstar.platform.clientorders.dto;

import com.cstar.platform.clientorders.model.ServicePaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateClientServiceOrderPaymentPlanRequest(
        @NotNull ServicePaymentMethod paymentMethod,
        @NotNull @Min(1) @Max(12) Integer installmentCount,
        Boolean downPaymentEnabled,
        @DecimalMin(value = "0.01", message = "Entrada deve ser maior que zero") BigDecimal downPaymentAmount,
        Boolean customSplitPaymentEnabled,
        ServicePaymentMethod downPaymentMethod,
        ServicePaymentMethod remainingPaymentMethod
) {
}
