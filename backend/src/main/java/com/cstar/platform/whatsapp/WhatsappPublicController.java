package com.cstar.platform.whatsapp;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public/whatsapp")
public class WhatsappPublicController {

    private final WhatsappSessionService whatsappSessionService;

    public WhatsappPublicController(WhatsappSessionService whatsappSessionService) {
        this.whatsappSessionService = whatsappSessionService;
    }

    @PostMapping("/evolution/webhook")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void receiveEvolutionWebhook(
            @RequestParam(name = "secret", required = false) String secret,
            @RequestBody Map<String, Object> payload
    ) {
        whatsappSessionService.handleEvolutionWebhook(secret, payload);
    }
}
