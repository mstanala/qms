package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class SystemConfigurationResponse {
    private UUID id;
    private String configKey;
    private String configValue;
    private String configType;
    private String module;
    private UUID plantSiteId;
    private String plantSiteName;
    private String description;
    private Boolean isEncrypted;
    private Instant updatedAt;
    private UUID updatedById;
    private String updatedByName;
}
