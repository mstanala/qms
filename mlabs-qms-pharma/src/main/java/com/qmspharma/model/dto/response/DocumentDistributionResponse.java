package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DocumentDistributionResponse {
    private UUID id;
    private UserRef recipient;
    private String departmentName;
    private Instant distributionDate;
    private Boolean acknowledged;
    private Instant acknowledgedDate;
    private Boolean trainingRequired;
    private Boolean trainingCompleted;
}