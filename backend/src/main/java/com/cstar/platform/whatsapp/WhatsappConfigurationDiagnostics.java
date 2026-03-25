package com.cstar.platform.whatsapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class WhatsappConfigurationDiagnostics implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(WhatsappConfigurationDiagnostics.class);

    private final WhatsappProperties properties;

    public WhatsappConfigurationDiagnostics(WhatsappProperties properties) {
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        String provider = safe(properties.getProvider());
        String instancePrefix = safe(properties.getInstancePrefix());
        String evolutionBaseUrl = safe(properties.getEvolution().getBaseUrl());

        log.info("WhatsApp config loaded: provider={}, instancePrefix={}, evolutionBaseUrl={}", provider, instancePrefix, evolutionBaseUrl);

        if (!"evolution".equalsIgnoreCase(provider)) {
            return;
        }

        if (isLocalAddress(evolutionBaseUrl)) {
            log.warn("EVOLUTION_BASE_URL aponta para localhost/127.0.0.1. Em container Docker no servidor, isso geralmente quebra a integração.");
        }

        if (isDefaultWebhookSecret(properties.getWebhookSecret())) {
            log.warn("WHATSAPP_WEBHOOK_SECRET está com valor padrão/placeholder. Configure um segredo forte e exclusivo no servidor.");
        }
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isLocalAddress(String url) {
        if (url == null) {
            return false;
        }
        String normalized = url.toLowerCase();
        return normalized.contains("localhost") || normalized.contains("127.0.0.1");
    }

    private boolean isDefaultWebhookSecret(String secret) {
        if (secret == null) {
            return true;
        }
        String normalized = secret.trim().toLowerCase();
        if (normalized.isEmpty()) {
            return true;
        }
        return normalized.contains("change-me") || "change-me".equals(normalized);
    }
}
