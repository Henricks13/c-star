package com.cstar.platform.clinicservices.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record UpdateClinicServiceRequest(
        @NotBlank @Size(min = 2, max = 160) String name,
        @NotNull @DecimalMin(value = "0.00") BigDecimal price,
        Integer durationMinutes,
        Boolean active,
        @Size(max = 500) String notes,
        @Valid List<ServiceProductInput> consumedProducts
) {
}
