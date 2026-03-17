package com.cstar.platform.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 3, max = 160) String fullName,
        @NotBlank @Size(min = 6, max = 120) String password,
        String roleCode
) {
}
