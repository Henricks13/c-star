package com.cstar.platform.whatsapp.dto;

public record ContactSyncResponse(
        int conversationsSynced,
        int messagesProcessed
) {
}
