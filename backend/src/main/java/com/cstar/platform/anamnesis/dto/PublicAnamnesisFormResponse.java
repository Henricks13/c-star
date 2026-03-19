package com.cstar.platform.anamnesis.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PublicAnamnesisFormResponse(
        UUID clientId,
        String clientName,
        String cpf,
        boolean answered,
        Instant submittedAt,
        List<PublicAnamnesisQuestionResponse> questions,
        List<PublicAnamnesisAnsweredItemResponse> answers
) {
}
