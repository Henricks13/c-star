package com.cstar.platform.clientorders.dto;

import com.cstar.platform.clientorders.model.ServicePaymentMethod;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ConfirmClientServiceOrderPaymentRequest(
        @NotNull ServicePaymentMethod paymentMethod,
        @Min(1) @Max(12) Integer installmentCount,
        @NotNull Boolean paid,
        Boolean firstInstallmentPaid
) {
}
