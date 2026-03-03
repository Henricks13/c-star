package com.cstar.platform.auth;

import com.cstar.platform.auth.dto.AuthResponse;
import com.cstar.platform.auth.dto.LoginRequest;
import com.cstar.platform.auth.dto.RegisterRequest;
import com.cstar.platform.auth.model.User;
import com.cstar.platform.auth.repository.RoleRepository;
import com.cstar.platform.auth.repository.UserRepository;
import com.cstar.platform.auth.security.AuthUserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(LoginRequest request) {
                String normalizedEmail = request.email().trim().toLowerCase();

                if (!userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                        throw new ResponseStatusException(NOT_FOUND, "Usuário não encontrado");
                }

                Authentication authentication;
                try {
                        authentication = authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
                        );
                } catch (AuthenticationException ex) {
                        throw new ResponseStatusException(UNAUTHORIZED, "Senha incorreta");
                }

        AuthUserPrincipal principal = (AuthUserPrincipal) authentication.getPrincipal();

        String token = jwtService.generateToken(principal.getUsername(), Map.of(
                "uid", principal.getUserId(),
                "name", principal.getFullName(),
                "roles", principal.getRoleCodes(),
                "permissions", principal.getPermissionCodes()
        ));

        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                principal.getUserId(),
                principal.getFullName(),
                principal.getUsername(),
                principal.getRoleCodes(),
                principal.getPermissionCodes()
        );
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(BAD_REQUEST, "E-mail já cadastrado");
        }

        User user = User.create(
                request.email().trim().toLowerCase(),
                request.fullName().trim(),
                passwordEncoder.encode(request.password()),
                true,
                false
        );

        var collaboratorRole = roleRepository.findByCode("COLABORADOR")
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Perfil COLABORADOR não encontrado"));

        user.addRole(collaboratorRole);
        userRepository.save(user);

        return login(new LoginRequest(request.email(), request.password()));
    }
}
