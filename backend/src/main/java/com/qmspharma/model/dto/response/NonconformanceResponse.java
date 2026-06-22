package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NonconformanceResponse {
    private UUID id;
    private String ncNumber;
    private String title;
    private String description;
    private String ncType;
    private String classification;
    private String status;
    private String priority;
    private String productName;
    private String productCode;
    private String batchNumber;
    private String batchSize;
    private String quantityAffected;
    private String unitOfMeasure;
    private String detectedLocation;
    private String stageDetected;
    private String dispositionDecision;
    private String dispositionJustification;
    private ReferenceResponse dispositionApprovedBy;
    private Instant dispositionDate;
    private String holdStatus;
    private String holdLocation;
    private Instant holdInitiatedDate;
    private Instant holdReleasedDate;
    private ReferenceResponse holdReleasedBy;
    private Boolean capaRequired;
    private UUID capaId;
    private UUID deviationId;
    private UUID supplierId;
    private ReferenceResponse owner;
    private ReferenceResponse department;
    private ReferenceResponse plantSite;
    private String currentWorkflowStep;
    private Instant closedDate;
    private Instant createdAt;
    private Instant updatedAt;
}
