package com.cstar.platform.anamnesis.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AnamnesisQuestionRequest(
        @NotBlank @Size(max = 400) String questionText,
        @NotNull @Min(0) @Max(9999) Integer displayOrder,
        @NotNull Boolean active
) {
}
