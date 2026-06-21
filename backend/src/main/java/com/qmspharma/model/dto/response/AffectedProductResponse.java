package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AffectedProductResponse {
    private UUID id;
    private String productName;
    private String productCode;
    private String dosageForm;
    private List<String> markets;
    private String impactDescription;
}
