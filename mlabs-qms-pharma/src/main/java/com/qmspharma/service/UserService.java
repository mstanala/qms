package com.qmspharma.service;

import com.qmspharma.exception.*;
import com.qmspharma.model.dto.request.*;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.model.entity.*;
import com.qmspharma.model.enums.UserType;
import com.qmspharma.repository.*;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final ApplicationRoleRepository roleRepository;
    private final SecurityProfileRepository securityProfileRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserSecurityProfileRepository userSecurityProfileRepository;
    private final SecurityProfilePermissionRepository securityProfilePermissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(String search, UUID departmentId, String userType, Pageable pageable) {
        UserType type = userType != null ? UserType.valueOf(userType) : null;
        Specification<User> spec = (root, query, cb) -> cb.isTrue(root.get("isActive"));

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("displayName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern)
            ));
        }
        if (departmentId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("department").get("id"), departmentId));
        }
        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("userType"), type));
        }

        return userRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(UUID id) {
        return toResponse(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id)));
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new DuplicateResourceException("Username already exists: " + request.getUsername());
        if (userRepository.existsByEmail(request.getEmail()))
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        if (userRepository.existsByEmployeeId(request.getEmployeeId()))
            throw new DuplicateResourceException("Employee ID already exists: " + request.getEmployeeId());

        User user = new User();
        user.setEmployeeId(request.getEmployeeId());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setUserType(UserType.valueOf(request.getUserType()));
        user.setPhone(request.getPhone());
        user.setJobTitle(request.getJobTitle());
        user.setPasswordHash(passwordEncoder.encode("changeme"));
        user.setOrganization(organizationRepository.findById(request.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", request.getOrganizationId())));
        if (request.getPlantSiteId() != null)
            user.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId()).orElse(null));
        if (request.getDepartmentId() != null)
            user.setDepartment(departmentRepository.findById(request.getDepartmentId()).orElse(null));
        if (request.getManagerId() != null)
            user.setManager(userRepository.findById(request.getManagerId()).orElse(null));

        User currentUser = currentUserProvider.getCurrentUser();
        user.setCreatedBy(currentUser);
        user.setUpdatedBy(currentUser);

        user = userRepository.save(user);

        if (request.getRoleIds() != null) {
            for (UUID roleId : request.getRoleIds()) {
                assignRoleToUser(user, roleId, null, currentUser);
            }
        }

        return toResponse(user);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getUserType() != null) user.setUserType(UserType.valueOf(request.getUserType()));
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getJobTitle() != null) user.setJobTitle(request.getJobTitle());
        if (request.getDepartmentId() != null)
            user.setDepartment(departmentRepository.findById(request.getDepartmentId()).orElse(null));
        if (request.getPlantSiteId() != null)
            user.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId()).orElse(null));
        if (request.getManagerId() != null)
            user.setManager(userRepository.findById(request.getManagerId()).orElse(null));
        user.setUpdatedBy(currentUserProvider.getCurrentUser());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void updateStatus(UUID id, UserStatusRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        if (request.getIsActive() != null) user.setIsActive(request.getIsActive());
        if (request.getIsLocked() != null) {
            user.setIsLocked(request.getIsLocked());
            if (request.getIsLocked()) {
                user.setLockedAt(Instant.now());
                user.setLockReason(request.getReason());
            } else {
                user.setLockedAt(null);
                user.setLockReason(null);
                user.setFailedLoginCount(0);
            }
        }
        userRepository.save(user);
    }

    @Transactional
    public void assignRoles(UUID userId, AssignRolesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        User currentUser = currentUserProvider.getCurrentUser();
        for (UUID roleId : request.getRoleIds()) {
            if (!userRoleRepository.existsByUserIdAndRoleId(userId, roleId)) {
                assignRoleToUser(user, roleId, request.getPlantSiteId(), currentUser);
            }
        }
    }

    @Transactional
    public void removeRole(UUID userId, UUID roleId) {
        userRoleRepository.deleteByUserIdAndRoleId(userId, roleId);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (request.getCurrentPassword() != null && !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setLastPasswordChange(Instant.now());
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    private void assignRoleToUser(User user, UUID roleId, UUID plantSiteId, User assignedBy) {
        ApplicationRole role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));
        UserRole ur = new UserRole();
        ur.setUser(user);
        ur.setRole(role);
        ur.setAssignedBy(assignedBy);
        if (plantSiteId != null)
            ur.setPlantSite(plantSiteRepository.findById(plantSiteId).orElse(null));
        userRoleRepository.save(ur);
    }

    private UserResponse toResponse(User u) {
        var roles = u.getUserRoles().stream()
                .filter(ur -> ur.getIsActive())
                .map(ur -> RoleResponse.builder()
                        .id(ur.getRole().getId()).name(ur.getRole().getName())
                        .code(ur.getRole().getCode()).roleLevel(ur.getRole().getRoleLevel().name())
                        .description(ur.getRole().getDescription())
                        .isSystem(ur.getRole().getIsSystem())
                        .isActive(ur.getRole().getIsActive())
                        .permissions(ur.getRole().getRolePermissions().stream()
                                .map(rp -> toPermissionResponse(rp.getPermission()))
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());

        var profiles = u.getUserSecurityProfiles().stream()
                .map(usp -> SecurityProfileResponse.builder()
                        .id(usp.getSecurityProfile().getId())
                        .name(usp.getSecurityProfile().getName())
                        .build())
                .collect(Collectors.toList());

        Map<UUID, PermissionResponse> permissions = new LinkedHashMap<>();
        u.getUserRoles().stream()
                .filter(ur -> ur.getIsActive())
                .flatMap(ur -> ur.getRole().getRolePermissions().stream())
                .map(RolePermission::getPermission)
                .map(this::toPermissionResponse)
                .forEach(permission -> permissions.put(permission.getId(), permission));

        u.getUserSecurityProfiles().stream()
                .filter(usp -> usp.getSecurityProfile().getIsActive())
                .flatMap(usp -> securityProfilePermissionRepository.findBySecurityProfileId(usp.getSecurityProfile().getId()).stream())
                .map(SecurityProfilePermission::getPermission)
                .map(this::toPermissionResponse)
                .forEach(permission -> permissions.put(permission.getId(), permission));

        return UserResponse.builder()
                .id(u.getId()).employeeId(u.getEmployeeId()).username(u.getUsername())
                .email(u.getEmail()).firstName(u.getFirstName()).lastName(u.getLastName())
                .displayName(u.getDisplayName()).phone(u.getPhone()).jobTitle(u.getJobTitle())
                .userType(u.getUserType().name())
                .organizationId(u.getOrganization().getId())
                .organizationName(u.getOrganization().getName())
                .plantSiteId(u.getPlantSite() != null ? u.getPlantSite().getId() : null)
                .plantSiteName(u.getPlantSite() != null ? u.getPlantSite().getName() : null)
                .departmentId(u.getDepartment() != null ? u.getDepartment().getId() : null)
                .departmentName(u.getDepartment() != null ? u.getDepartment().getName() : null)
                .managerId(u.getManager() != null ? u.getManager().getId() : null)
                .managerName(u.getManager() != null ? u.getManager().getDisplayName() : null)
                .isActive(u.getIsActive()).isLocked(u.getIsLocked()).lastLoginAt(u.getLastLoginAt())
                .roles(roles).securityProfiles(profiles)
                .permissions(new ArrayList<>(permissions.values()))
                .createdAt(u.getCreatedAt()).updatedAt(u.getUpdatedAt())
                .build();
    }

    private PermissionResponse toPermissionResponse(Permission permission) {
        return PermissionResponse.builder()
                .id(permission.getId())
                .module(permission.getModule())
                .action(permission.getAction())
                .resource(permission.getResource())
                .description(permission.getDescription())
                .build();
    }
}
