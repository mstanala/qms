package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateUserRequest {
    @NotBlank private String employeeId;
    @NotBlank private String username;
    @NotBlank @Email private String email;
    @NotBlank private String firstName;
    @NotBlank private String lastName;
    @NotNull private String userType;
    @NotNull private UUID organizationId;
    private UUID plantSiteId;
    private UUID departmentId;
    private UUID managerId;
    private String phone;
    private String jobTitle;
    private List<UUID> roleIds;
    private List<UUID> securityProfileIds;
}
