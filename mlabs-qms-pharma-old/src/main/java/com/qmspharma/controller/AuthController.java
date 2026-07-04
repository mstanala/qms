package com.qmspharma.controller;

import com.qmspharma.model.dto.request.LoginRequest;
import com.qmspharma.model.dto.request.RefreshTokenRequest;
import com.qmspharma.model.dto.response.AuthResponse;
import com.qmspharma.model.dto.response.UserResponse;
import com.qmspharma.security.CurrentUserProvider;
import com.qmspharma.service.AuthService;
import com.qmspharma.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(userService.getUser(currentUserProvider.getCurrentUserId()));
    }
}
