package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ChangeImpactResponse {
    private UUID id;
    private String productQuality;
    private String patientSafety;
    private String regulatoryCompliance;
    private String validationStatus;
    private String documentation;
    private String training;
    private String supplierQualification;
    private String stability;
    private String overallRiskLevel;
    private String assessmentSummary;
    private UserRef assessedBy;
    private Instant assessedDate;
}
