package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ChangeRequestResponse {
    private UUID id;
    private String changeNumber;
    private String title;
    private String description;
    private String justification;
    private String type;
    private String category;
    private String classification;
    private String status;
    private String priority;
    private UserRef requestedBy;
    private Instant requestedDate;
    private UUID departmentId;
    private String departmentName;
    private UserRef changeOwner;
    private UserRef qaReviewer;
    private UserRef raReviewer;
    private UUID plantSiteId;
    private String plantSiteName;
    private List<String> affectedAreas;
    private Instant targetImplementationDate;
    private Instant actualImplementationDate;
    private Instant effectivenessCheckDate;
    private Instant closedDate;
    private Boolean regulatoryFilingRequired;
    private Boolean validationRequired;
    private String validationDetails;
    private Boolean trainingRequired;
    private List<String> relatedDeviations;
    private List<String> relatedCapas;
    private List<String> relatedChanges;
    private String currentWorkflowStep;
    private ChangeImpactResponse impactAssessment;
    private RegulatoryFilingResponse regulatoryFiling;
    private List<AffectedDocumentResponse> affectedDocuments;
    private List<AffectedProductResponse> affectedProducts;
    private List<ImplementationTaskResponse> implementationTasks;
    private List<TrainingRequirementResponse> trainingRequirements;
    private List<ChangeApprovalResponse> approvals;
    private List<EffectivenessReviewResponse> effectivenessReviews;
    private Instant createdAt;
    private Instant updatedAt;
    private Integer version;
}
