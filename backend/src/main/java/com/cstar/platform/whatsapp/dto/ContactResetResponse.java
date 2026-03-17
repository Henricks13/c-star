package com.cstar.platform.whatsapp.dto;

public record ContactResetResponse(
        long contactsDeleted,
        long conversationsDeleted,
        long messagesDeleted
) {
}
