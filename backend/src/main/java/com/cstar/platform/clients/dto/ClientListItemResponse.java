package com.cstar.platform.clients.dto;

import java.time.Instant;
import java.util.UUID;

public record ClientListItemResponse(
        UUID id,
        String fullName,
        String phone,
        String cpf,
        String email,
        String origin,
        UUID sourceContactId,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}
