package com.cstar.platform.products.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProductTypeRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @Size(max = 400) String description,
        Boolean active
) {
}
