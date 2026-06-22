package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String employeeId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String displayName;
    private String phone;
    private String jobTitle;
    private String userType;
    private UUID organizationId;
    private String organizationName;
    private UUID plantSiteId;
    private String plantSiteName;
    private UUID departmentId;
    private String departmentName;
    private UUID managerId;
    private String managerName;
    private Boolean isActive;
    private Boolean isLocked;
    private Instant lastLoginAt;
    private List<RoleResponse> roles;
    private List<SecurityProfileResponse> securityProfiles;
    private Instant createdAt;
    private Instant updatedAt;
}
