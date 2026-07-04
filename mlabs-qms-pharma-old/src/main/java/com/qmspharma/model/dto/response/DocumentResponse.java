package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DocumentResponse {
    private UUID id;
    private String documentNumber;
    private String title;
    private String description;
    private String documentType;
    private String category;
    private String subCategory;
    private UUID departmentId;
    private String departmentName;
    private UUID plantSiteId;
    private String plantSiteName;
    private UserRef owner;
    private String status;
    private String currentVersion;
    private Instant effectiveDate;
    private Instant expiryDate;
    private Instant nextReviewDate;
    private Integer reviewPeriodMonths;
    private String confidentialityLevel;
    private String regulatoryReference;
    private String keywords;
    private Boolean isTemplate;
    private String currentWorkflowStep;
    private List<String> currentCandidateRoles;
    private List<UserRef> currentCandidateUsers;
    private List<String> reviewCandidateRoles;
    private List<UserRef> reviewCandidateUsers;
    private List<String> approvalCandidateRoles;
    private List<UserRef> approvalCandidateUsers;
    private List<DocumentVersionResponse> versions;
    private List<DocumentReviewResponse> reviews;
    private List<DocumentApprovalResponse> approvals;
    private List<DocumentDistributionResponse> distributions;
    private List<AuditTrailResponse> auditTrail;
    private Instant createdAt;
    private Instant updatedAt;
    private Integer version;
}
