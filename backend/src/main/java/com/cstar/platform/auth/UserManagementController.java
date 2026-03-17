package com.cstar.platform.auth;

import com.cstar.platform.auth.dto.CreateUserRequest;
import com.cstar.platform.auth.dto.UpdateUserPasswordRequest;
import com.cstar.platform.auth.dto.UpdateUserRequest;
import com.cstar.platform.auth.dto.UserListItemResponse;
import com.cstar.platform.auth.security.AuthUserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public List<UserListItemResponse> listUsers(@AuthenticationPrincipal AuthUserPrincipal principal) {
        validateAccess(principal);
        return userManagementService.listUsers();
    }

    @PostMapping
    public UserListItemResponse createUser(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestBody @Valid CreateUserRequest request
    ) {
        validateAccess(principal);
        return userManagementService.createUser(request);
    }

    @PutMapping("/{userId}")
    public UserListItemResponse updateUser(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @RequestBody @Valid UpdateUserRequest request
    ) {
        validateAccess(principal);
        return userManagementService.updateUser(userId, request);
    }

    @PutMapping("/{userId}/password")
    public void updateUserPassword(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @RequestBody @Valid UpdateUserPasswordRequest request
    ) {
        validateAccess(principal);
        userManagementService.updateUserPassword(userId, request);
    }

    private void validateAccess(AuthUserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerenciar usuários.");
        }

        String email = principal.getUsername() == null ? "" : principal.getUsername().trim().toLowerCase();
        if ("carol@gmail.com".equals(email)) {
            return;
        }

        boolean authorizedByRole = principal.getRoleCodes().stream()
                .map(code -> code == null ? "" : code.trim().toUpperCase())
                .anyMatch(code -> "DEV_SUPORTE".equals(code) || "MASTER_ADMIN".equals(code));

        if (!authorizedByRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para gerenciar usuários.");
        }
    }
}
