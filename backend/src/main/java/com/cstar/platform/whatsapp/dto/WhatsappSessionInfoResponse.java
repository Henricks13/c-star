package com.cstar.platform.whatsapp.dto;

import java.time.Instant;

public record WhatsappSessionInfoResponse(
        boolean connected,
        String displayName,
        String phoneNumber,
        String profilePicUrl,
        String provider,
        Instant connectedAt,
        Instant lastSyncAt
) {
}
