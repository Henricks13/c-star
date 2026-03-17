package com.cstar.platform.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserPasswordRequest(
        @NotBlank @Size(min = 6, max = 120) String password
) {
}
