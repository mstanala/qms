package com.qmspharma.security;

import com.qmspharma.model.entity.User;
import com.qmspharma.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String userIdOrUsername) throws UsernameNotFoundException {
        User user;
        try {
            UUID userId = UUID.fromString(userIdOrUsername);
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userIdOrUsername));
        } catch (IllegalArgumentException e) {
            user = userRepository.findByUsername(userIdOrUsername)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userIdOrUsername));
        }

        var authorities = user.getUserRoles().stream()
                .filter(ur -> ur.getIsActive())
                .map(ur -> new SimpleGrantedAuthority("ROLE_" + ur.getRole().getCode()))
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getId().toString(),
                user.getPasswordHash() != null ? user.getPasswordHash() : "",
                user.getIsActive(),
                true,
                true,
                !user.getIsLocked(),
                authorities
        );
    }
}
