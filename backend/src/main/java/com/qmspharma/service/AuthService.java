package com.qmspharma.service;

import com.qmspharma.exception.UnauthorizedException;
import com.qmspharma.model.dto.request.LoginRequest;
import com.qmspharma.model.dto.response.AuthResponse;
import com.qmspharma.model.entity.User;
import com.qmspharma.model.entity.UserLoginAudit;
import com.qmspharma.model.enums.LoginStatus;
import com.qmspharma.repository.UserLoginAuditRepository;
import com.qmspharma.repository.UserRepository;
import com.qmspharma.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserLoginAuditRepository loginAuditRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    logLoginAttempt(null, request.getUsername(), LoginStatus.FAILED, "User not found", httpRequest);
                    return new UnauthorizedException("Invalid credentials");
                });

        if (user.getIsLocked()) {
            logLoginAttempt(user, request.getUsername(), LoginStatus.LOCKED_OUT, "Account locked", httpRequest);
            throw new UnauthorizedException("Account is locked: " + user.getLockReason());
        }

        if (!user.getIsActive()) {
            throw new UnauthorizedException("Account is deactivated");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setFailedLoginCount(user.getFailedLoginCount() + 1);
            if (user.getFailedLoginCount() >= 5) {
                user.setIsLocked(true);
                user.setLockedAt(Instant.now());
                user.setLockReason("Too many failed login attempts");
            }
            userRepository.save(user);
            logLoginAttempt(user, request.getUsername(), LoginStatus.FAILED, "Invalid password", httpRequest);
            throw new UnauthorizedException("Invalid credentials");
        }

        user.setFailedLoginCount(0);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        logLoginAttempt(user, request.getUsername(), LoginStatus.SUCCESS, null, httpRequest);

        return AuthResponse.builder()
                .accessToken(accessToken).refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration() / 1000)
                .user(userService.getUser(user.getId()))
                .build();
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        var userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getUsername());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
        return AuthResponse.builder()
                .accessToken(newAccessToken).refreshToken(newRefreshToken)
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration() / 1000)
                .user(userService.getUser(user.getId()))
                .build();
    }

    private void logLoginAttempt(User user, String username, LoginStatus status, String reason, HttpServletRequest req) {
        UserLoginAudit audit = new UserLoginAudit();
        audit.setUser(user);
        audit.setUsername(username);
        audit.setLoginStatus(status);
        audit.setFailureReason(reason);
        if (req != null) {
            audit.setIpAddress(req.getRemoteAddr());
            audit.setUserAgent(req.getHeader("User-Agent"));
        }
        loginAuditRepository.save(audit);
    }
}
