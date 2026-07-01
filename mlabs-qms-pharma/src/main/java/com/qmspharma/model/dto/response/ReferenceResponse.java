package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ReferenceResponse {
    private UUID id;
    private String name;
    private String code;
    private String displayName;
    private String email;
}
