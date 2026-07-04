package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class PermissionResponse {
    private UUID id;
    private String module;
    private String action;
    private String resource;
    private String description;
}
