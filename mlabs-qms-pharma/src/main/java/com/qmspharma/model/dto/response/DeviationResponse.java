package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DeviationResponse {
    private UUID id;
    private String deviationNumber;
    private String title;
    private String description;
    private String type;
    private String category;
    private String classification;
    private String status;
    private String sourceArea;
    private Instant occurredDate;
    private Instant reportedDate;
    private Instant detectedDate;
    private Instant targetClosureDate;
    private Instant actualClosureDate;
    private UserRef reportedBy;
    private UserRef assignedTo;
    private UserRef reviewer;
    private UserRef approvedBy;
    private UUID plantSiteId;
    private String plantSiteName;
    private UUID departmentId;
    private String departmentName;
    private String area;
    private String equipment;
    private String product;
    private String batchNumber;
    private String batchSize;
    private Boolean gmpImpact;
    private Boolean patientSafetyImpact;
    private Boolean regulatoryImpact;
    private Boolean capaRequired;
    private UUID capaId;
    private String capaNumber;
    private String currentWorkflowStep;
    private List<AffectedBatchResponse> affectedBatches;
    private InvestigationResponse investigation;
    private ImpactAssessmentResponse impactAssessment;
    private DispositionResponse disposition;
    private Instant createdAt;
    private Instant updatedAt;
    private Integer version;
}
