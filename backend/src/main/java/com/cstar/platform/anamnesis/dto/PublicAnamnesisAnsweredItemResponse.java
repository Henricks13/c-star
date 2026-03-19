package com.cstar.platform.anamnesis.dto;

import java.util.UUID;

public record PublicAnamnesisAnsweredItemResponse(
        UUID questionIdSnapshot,
        String questionText,
        String answerText,
        int displayOrder
) {
}
