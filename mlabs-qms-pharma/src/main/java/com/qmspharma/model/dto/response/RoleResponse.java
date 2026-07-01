package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RoleResponse {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private String roleLevel;
    private Boolean isSystem;
    private Boolean isActive;
    private List<PermissionResponse> permissions;
}
