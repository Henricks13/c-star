package com.cstar.platform.whatsapp.dto;

import java.time.Instant;

public record WhatsappQrCodeResponse(
        String qrCodeBase64,
        Instant expiresAt
) {
}
