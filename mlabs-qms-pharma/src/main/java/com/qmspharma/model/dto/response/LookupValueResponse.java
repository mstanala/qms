package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class LookupValueResponse {
    private UUID id;
    private String category;
    private String code;
    private String displayValue;
    private String description;
    private Integer sortOrder;
}
