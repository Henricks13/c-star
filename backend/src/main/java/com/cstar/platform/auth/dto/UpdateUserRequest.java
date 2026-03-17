package com.cstar.platform.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 3, max = 160) String fullName,
        String roleCode
) {
}
