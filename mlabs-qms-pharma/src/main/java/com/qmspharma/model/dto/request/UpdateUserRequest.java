package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.Email;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateUserRequest {
    @Email private String email;
    private String firstName;
    private String lastName;
    private String userType;
    private UUID departmentId;
    private UUID plantSiteId;
    private UUID managerId;
    private String phone;
    private String jobTitle;
}
