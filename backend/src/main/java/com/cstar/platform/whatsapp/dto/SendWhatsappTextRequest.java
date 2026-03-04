package com.cstar.platform.whatsapp.dto;

import jakarta.validation.constraints.NotBlank;

public record SendWhatsappTextRequest(
        @NotBlank String phone,
        @NotBlank String text
) {
}
