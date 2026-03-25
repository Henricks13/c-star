package com.cstar.platform.whatsapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class WhatsappAutoSyncScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(WhatsappAutoSyncScheduler.class);

    private final WhatsappContactSyncService whatsappContactSyncService;

    public WhatsappAutoSyncScheduler(WhatsappContactSyncService whatsappContactSyncService) {
        this.whatsappContactSyncService = whatsappContactSyncService;
    }

    @Scheduled(cron = "0 0 0,6,12,18 * * *", zone = "America/Sao_Paulo")
    public void runScheduledSync() {
        try {
            var result = whatsappContactSyncService.syncAllConversations(null);
            LOGGER.info("Auto-sync WhatsApp concluído. conversas={}, mensagens={}", result.conversationsSynced(), result.messagesProcessed());
        } catch (Exception ex) {
            LOGGER.error("Falha no auto-sync WhatsApp agendado", ex);
        }
    }
}
