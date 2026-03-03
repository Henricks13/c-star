package com.cstar.platform.auth.dto;

import java.util.Set;
import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UUID userId,
        String fullName,
        String email,
        Set<String> roles,
        Set<String> permissions
) {
}
