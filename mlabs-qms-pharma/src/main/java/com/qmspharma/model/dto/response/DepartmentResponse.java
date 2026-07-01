package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DepartmentResponse {
    private UUID id;
    private UUID plantSiteId;
    private String plantSiteName;
    private String name;
    private String code;
    private String description;
    private UUID parentDepartmentId;
    private String parentDepartmentName;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
