package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class AssignRolesRequest {
    @NotEmpty private List<UUID> roleIds;
    private UUID plantSiteId;
}
