package com.cstar.platform.anamnesis.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record SubmitPublicAnamnesisRequest(
        UUID clientId,
        @Size(max = 20) String cpf,
        @Valid List<SubmitPublicAnamnesisAnswerRequest> answers
) {
}
