package com.qmspharma.security;

import com.qmspharma.model.entity.User;
import com.qmspharma.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.qmspharma.exception.UnauthorizedException("No authenticated user");
        }
        UUID userId = UUID.fromString(auth.getName());
        return userRepository.findById(userId)
                .orElseThrow(() -> new com.qmspharma.exception.UnauthorizedException("User not found"));
    }

    public UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new com.qmspharma.exception.UnauthorizedException("No authenticated user");
        }
        return UUID.fromString(auth.getName());
    }
}
