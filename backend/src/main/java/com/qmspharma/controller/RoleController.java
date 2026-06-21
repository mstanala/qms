package com.qmspharma.controller;

import com.qmspharma.model.dto.request.CreateRoleRequest;
import com.qmspharma.model.dto.request.CreateSecurityProfileRequest;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping("/roles")
    public ResponseEntity<List<RoleResponse>> listRoles() {
        return ResponseEntity.ok(roleService.listRoles());
    }

    @GetMapping("/roles/{id}")
    public ResponseEntity<RoleResponse> getRole(@PathVariable UUID id) {
        return ResponseEntity.ok(roleService.getRole(id));
    }

    @PostMapping("/roles")
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody CreateRoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.createRole(request));
    }

    @PutMapping("/roles/{id}")
    public ResponseEntity<RoleResponse> updateRole(@PathVariable UUID id, @Valid @RequestBody CreateRoleRequest request) {
        return ResponseEntity.ok(roleService.updateRole(id, request));
    }

    @GetMapping("/permissions")
    public ResponseEntity<List<PermissionResponse>> listPermissions(@RequestParam(required = false) String module) {
        return ResponseEntity.ok(roleService.listPermissions(module));
    }

    @GetMapping("/security-profiles")
    public ResponseEntity<List<SecurityProfileResponse>> listSecurityProfiles() {
        return ResponseEntity.ok(roleService.listSecurityProfiles());
    }

    @PostMapping("/security-profiles")
    public ResponseEntity<SecurityProfileResponse> createSecurityProfile(@Valid @RequestBody CreateSecurityProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.createSecurityProfile(request));
    }
}
