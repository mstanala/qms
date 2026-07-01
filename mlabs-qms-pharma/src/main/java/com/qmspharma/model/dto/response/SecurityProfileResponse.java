package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SecurityProfileResponse {
    private UUID id;
    private String name;
    private String description;
    private Boolean isSystem;
}
