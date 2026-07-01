package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AffectedBatchResponse {
    private UUID id;
    private String batchNumber;
    private String productName;
    private String batchSize;
    private String impactDescription;
    private String disposition;
}
