package com.qmspharma.controller;

import com.qmspharma.model.dto.request.ChangePasswordRequest;
import com.qmspharma.model.dto.request.UpdateUserRequest;
import com.qmspharma.model.dto.request.UpdateUserPreferencesRequest;
import com.qmspharma.model.dto.response.UserActivityResponse;
import com.qmspharma.model.dto.response.UserPreferencesResponse;
import com.qmspharma.model.dto.response.UserResponse;
import com.qmspharma.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<UserResponse> getProfile() {
        return ResponseEntity.ok(userProfileService.getProfile());
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userProfileService.updateProfile(request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userProfileService.changePassword(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/preferences")
    public ResponseEntity<UserPreferencesResponse> getPreferences() {
        return ResponseEntity.ok(userProfileService.getPreferences());
    }

    @PutMapping("/preferences")
    public ResponseEntity<UserPreferencesResponse> updatePreferences(@RequestBody UpdateUserPreferencesRequest request) {
        return ResponseEntity.ok(userProfileService.updatePreferences(request));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<UserActivityResponse>> activity(@RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(userProfileService.getActivity(size));
    }
}
