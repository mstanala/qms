package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateDepartmentRequest {
    @NotNull private UUID plantSiteId;
    @NotBlank private String name;
    @NotBlank private String code;
    private String description;
    private UUID parentDepartmentId;
}
