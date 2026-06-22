package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CurriculumResponse {
    private UUID id;
    private String curriculumCode;
    private String title;
    private String description;
    private String category;
    private String trainingType;
    private UUID departmentId;
    private String departmentName;
    private UUID plantSiteId;
    private String plantSiteName;
    private UserRef owner;
    private String status;
    private BigDecimal durationHours;
    private Integer passingScore;
    private Integer maxAttempts;
    private Integer validityMonths;
    private Boolean isMandatory;
    private String regulatoryRequirement;
    private String prerequisites;
    private UUID relatedDocumentId;
    private String relatedDocumentNumber;
    private Instant effectiveDate;
    private Instant createdAt;
    private Instant updatedAt;
    private Integer version;
}