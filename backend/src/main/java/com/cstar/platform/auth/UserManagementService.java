package com.cstar.platform.auth;

import com.cstar.platform.auth.dto.CreateUserRequest;
import com.cstar.platform.auth.dto.UpdateUserPasswordRequest;
import com.cstar.platform.auth.dto.UpdateUserRequest;
import com.cstar.platform.auth.dto.UserListItemResponse;
import com.cstar.platform.auth.model.Role;
import com.cstar.platform.auth.model.User;
import com.cstar.platform.auth.repository.RoleRepository;
import com.cstar.platform.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserListItemResponse> listUsers() {
        return userRepository.findAllWithRolesByOrderByFullNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public UserListItemResponse createUser(CreateUserRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(BAD_REQUEST, "E-mail já cadastrado");
        }

        User user = User.create(
                normalizedEmail,
                request.fullName().trim(),
                passwordEncoder.encode(request.password()),
                true,
                false
        );

        String requestedRoleCode = request.roleCode() == null || request.roleCode().isBlank()
                ? "COLABORADOR"
                : request.roleCode().trim().toUpperCase();

        Role role = roleRepository.findByCode(requestedRoleCode)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Perfil informado não existe"));

        user.addRole(role);
        userRepository.save(user);

        return toResponse(user);
    }

    @Transactional
    public UserListItemResponse updateUser(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findWithRolesById(userId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Usuário não encontrado"));

        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, userId)) {
            throw new ResponseStatusException(BAD_REQUEST, "E-mail já cadastrado");
        }

        user.setEmail(normalizedEmail);
        user.setFullName(request.fullName().trim());

        String requestedRoleCode = request.roleCode() == null || request.roleCode().isBlank()
                ? "COLABORADOR"
                : request.roleCode().trim().toUpperCase();

        Role role = roleRepository.findByCode(requestedRoleCode)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Perfil informado não existe"));

        user.getRoles().clear();
        user.addRole(role);

        userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public void updateUserPassword(UUID userId, UpdateUserPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Usuário não encontrado"));

        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);
    }

    private UserListItemResponse toResponse(User user) {
        LinkedHashSet<String> roles = user.getRoles().stream()
                .map(Role::getCode)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        return new UserListItemResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.isEnabled(),
                roles
        );
    }
}
