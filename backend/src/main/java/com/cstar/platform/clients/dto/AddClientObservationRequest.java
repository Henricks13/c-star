package com.cstar.platform.clients.dto;

import jakarta.validation.constraints.NotBlank;

public record AddClientObservationRequest(
        @NotBlank String note
) {
}
