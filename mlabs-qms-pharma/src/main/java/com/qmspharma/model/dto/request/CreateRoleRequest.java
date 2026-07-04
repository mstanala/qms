package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateRoleRequest {
    @NotBlank private String name;
    @NotBlank private String code;
    private String description;
    @NotNull private String roleLevel;
    private List<UUID> permissionIds;
}
