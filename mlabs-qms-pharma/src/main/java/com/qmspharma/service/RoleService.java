package com.qmspharma.service;

import com.qmspharma.exception.*;
import com.qmspharma.model.dto.request.*;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.model.entity.*;
import com.qmspharma.model.enums.RoleLevel;
import com.qmspharma.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final ApplicationRoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final SecurityProfileRepository securityProfileRepository;
    private final SecurityProfilePermissionRepository spPermissionRepository;

    @Transactional(readOnly = true)
    public List<RoleResponse> listRoles() {
        return roleRepository.findByIsActiveTrue().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoleResponse getRole(UUID id) {
        return toResponse(roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id)));
    }

    @Transactional
    public RoleResponse createRole(CreateRoleRequest request) {
        if (roleRepository.existsByCode(request.getCode()))
            throw new DuplicateResourceException("Role code already exists: " + request.getCode());
        ApplicationRole role = new ApplicationRole();
        role.setName(request.getName());
        role.setCode(request.getCode());
        role.setDescription(request.getDescription());
        role.setRoleLevel(RoleLevel.valueOf(request.getRoleLevel()));
        role = roleRepository.save(role);
        if (request.getPermissionIds() != null) {
            for (UUID permId : request.getPermissionIds()) {
                Permission perm = permissionRepository.findById(permId).orElse(null);
                if (perm != null) {
                    RolePermission rp = new RolePermission();
                    rp.setRole(role);
                    rp.setPermission(perm);
                    rolePermissionRepository.save(rp);
                }
            }
        }
        return toResponse(role);
    }

    @Transactional
    public RoleResponse updateRole(UUID id, CreateRoleRequest request) {
        ApplicationRole role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        if (request.getName() != null) role.setName(request.getName());
        if (request.getDescription() != null) role.setDescription(request.getDescription());
        if (request.getRoleLevel() != null) role.setRoleLevel(RoleLevel.valueOf(request.getRoleLevel()));
        return toResponse(roleRepository.save(role));
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> listPermissions(String module) {
        var perms = module != null ? permissionRepository.findByModule(module) : permissionRepository.findAll();
        return perms.stream().map(p -> PermissionResponse.builder()
                .id(p.getId()).module(p.getModule()).action(p.getAction())
                .resource(p.getResource()).description(p.getDescription()).build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SecurityProfileResponse> listSecurityProfiles() {
        return securityProfileRepository.findByIsActiveTrue().stream()
                .map(sp -> SecurityProfileResponse.builder()
                        .id(sp.getId()).name(sp.getName()).description(sp.getDescription())
                        .isSystem(sp.getIsSystem()).build())
                .collect(Collectors.toList());
    }

    @Transactional
    public SecurityProfileResponse createSecurityProfile(CreateSecurityProfileRequest request) {
        SecurityProfile sp = new SecurityProfile();
        sp.setName(request.getName());
        sp.setDescription(request.getDescription());
        sp = securityProfileRepository.save(sp);
        if (request.getPermissionIds() != null) {
            for (UUID permId : request.getPermissionIds()) {
                Permission perm = permissionRepository.findById(permId).orElse(null);
                if (perm != null) {
                    SecurityProfilePermission spp = new SecurityProfilePermission();
                    spp.setSecurityProfile(sp);
                    spp.setPermission(perm);
                    spPermissionRepository.save(spp);
                }
            }
        }
        return SecurityProfileResponse.builder()
                .id(sp.getId()).name(sp.getName()).description(sp.getDescription())
                .isSystem(sp.getIsSystem()).build();
    }

    private RoleResponse toResponse(ApplicationRole r) {
        var perms = r.getRolePermissions().stream()
                .map(rp -> PermissionResponse.builder()
                        .id(rp.getPermission().getId()).module(rp.getPermission().getModule())
                        .action(rp.getPermission().getAction()).resource(rp.getPermission().getResource())
                        .description(rp.getPermission().getDescription()).build())
                .collect(Collectors.toList());
        return RoleResponse.builder()
                .id(r.getId()).name(r.getName()).code(r.getCode()).description(r.getDescription())
                .roleLevel(r.getRoleLevel().name()).isSystem(r.getIsSystem()).isActive(r.getIsActive())
                .permissions(perms).build();
    }
}
