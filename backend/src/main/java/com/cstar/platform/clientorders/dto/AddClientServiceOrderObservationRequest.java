package com.cstar.platform.clientorders.dto;

import jakarta.validation.constraints.NotBlank;

public record AddClientServiceOrderObservationRequest(
        @NotBlank String note
) {
}
