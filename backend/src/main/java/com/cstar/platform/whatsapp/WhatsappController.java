package com.cstar.platform.whatsapp;

import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.whatsapp.dto.SendWhatsappTextRequest;
import com.cstar.platform.whatsapp.dto.WhatsappQrCodeResponse;
import com.cstar.platform.whatsapp.dto.WhatsappSessionInfoResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/whatsapp")
public class WhatsappController {

    private final WhatsappSessionService whatsappSessionService;

    public WhatsappController(WhatsappSessionService whatsappSessionService) {
        this.whatsappSessionService = whatsappSessionService;
    }

    @GetMapping("/session")
    public WhatsappSessionInfoResponse getSession(@AuthenticationPrincipal AuthUserPrincipal principal) {
        return whatsappSessionService.getSession(principal);
    }

    @PostMapping("/session/qr-code")
    public WhatsappQrCodeResponse generateQrCode(@AuthenticationPrincipal AuthUserPrincipal principal) {
        return whatsappSessionService.generateQrCode(principal);
    }

    @PostMapping("/session/connect")
    public WhatsappSessionInfoResponse connect(@AuthenticationPrincipal AuthUserPrincipal principal) {
        return whatsappSessionService.connect(principal);
    }

    @PostMapping("/session/disconnect")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disconnect(@AuthenticationPrincipal AuthUserPrincipal principal) {
        whatsappSessionService.disconnect(principal);
    }

    @PostMapping("/messages/text")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendText(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestBody @Valid SendWhatsappTextRequest request
    ) {
        whatsappSessionService.sendText(principal, request.phone(), request.text());
    }
}
