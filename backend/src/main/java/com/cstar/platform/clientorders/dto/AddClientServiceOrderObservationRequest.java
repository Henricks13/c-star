package com.cstar.platform.clientorders.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddClientServiceOrderObservationRequest(
        @NotBlank @Size(max = 500) String note
) {
}
