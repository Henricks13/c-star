package com.cstar.platform.anamnesis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SubmitPublicAnamnesisAnswerRequest(
        @NotNull UUID questionId,
        @NotBlank @Size(max = 2000) String answerText
) {
}
