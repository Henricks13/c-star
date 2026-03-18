package com.cstar.platform.clients.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateClientRequest(
        @NotBlank @Size(min = 2, max = 160) String fullName,
        @NotBlank @Size(min = 8, max = 30) String phone,
        @Size(max = 20) String cpf,
        @Email @Size(max = 160) String email,
        @NotBlank String origin,
        UUID sourceContactId,
        @Size(max = 500) String notes
) {
}
