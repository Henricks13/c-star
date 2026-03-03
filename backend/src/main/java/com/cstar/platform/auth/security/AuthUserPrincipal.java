package com.cstar.platform.auth.security;

import com.cstar.platform.auth.model.Permission;
import com.cstar.platform.auth.model.Role;
import com.cstar.platform.auth.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

public class AuthUserPrincipal implements UserDetails {

    private final UUID userId;
    private final String email;
    private final String fullName;
    private final String passwordHash;
    private final boolean enabled;
    private final Set<String> roleCodes;
    private final Set<String> permissionCodes;
    private final Set<GrantedAuthority> authorities;

    private AuthUserPrincipal(
            UUID userId,
            String email,
            String fullName,
            String passwordHash,
            boolean enabled,
            Set<String> roleCodes,
            Set<String> permissionCodes,
            Set<GrantedAuthority> authorities
    ) {
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.enabled = enabled;
        this.roleCodes = roleCodes;
        this.permissionCodes = permissionCodes;
        this.authorities = authorities;
    }

    public static AuthUserPrincipal from(User user) {
        Set<String> roleCodes = new LinkedHashSet<>();
        Set<String> permissionCodes = new LinkedHashSet<>();
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();

        for (Role role : user.getRoles()) {
            roleCodes.add(role.getCode());
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getCode()));

            for (Permission permission : role.getPermissions()) {
                permissionCodes.add(permission.getCode());
                authorities.add(new SimpleGrantedAuthority(permission.getCode()));
            }
        }

        return new AuthUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPasswordHash(),
                user.isEnabled(),
                roleCodes,
                permissionCodes,
                authorities
        );
    }

    public UUID getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public Set<String> getRoleCodes() {
        return roleCodes;
    }

    public Set<String> getPermissionCodes() {
        return permissionCodes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
