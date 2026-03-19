package com.cstar.platform.anamnesis.dto;

import java.util.UUID;

public record PublicAnamnesisQuestionResponse(
        UUID id,
        String questionText,
        int displayOrder
) {
}
