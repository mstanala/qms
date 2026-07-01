package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CapaResponse {
    private UUID id;
    private String capaNumber;
    private String title;
    private String description;
    private String type;
    private String status;
    private String priority;
    private String sourceType;
    private String sourceReference;
    private Instant initiatedDate;
    private Instant targetCompletionDate;
    private Instant actualCompletionDate;
    private Instant dueDate;
    private UserRef initiator;
    private UserRef owner;
    private UUID departmentId;
    private String departmentName;
    private UUID plantSiteId;
    private String plantSiteName;
    private String product;
    private String batchNumber;
    private UUID deviationId;
    private String deviationNumber;
    private String currentWorkflowStep;
    private RcaResponse rootCauseAnalysis;
    private RiskAssessmentResponse riskAssessment;
    private List<CapaActionResponse> actions;
    private List<EffectivenessCheckResponse> effectivenessChecks;
    private Instant createdAt;
    private Instant updatedAt;
    private Integer version;
}
