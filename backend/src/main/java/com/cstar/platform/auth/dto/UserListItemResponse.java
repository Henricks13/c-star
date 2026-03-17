package com.cstar.platform.auth.dto;

import java.util.Set;
import java.util.UUID;

public record UserListItemResponse(
        UUID id,
        String fullName,
        String email,
        boolean enabled,
        Set<String> roles
) {
}
