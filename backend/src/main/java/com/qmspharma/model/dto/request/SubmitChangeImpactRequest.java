package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitChangeImpactRequest {
    @NotNull private String productQuality;
    @NotNull private String patientSafety;
    @NotNull private String regulatoryCompliance;
    @NotNull private String validationStatus;
    @NotNull private String documentation;
    @NotNull private String training;
    @NotNull private String supplierQualification;
    @NotNull private String stability;
    @NotNull private String overallRiskLevel;
    @NotBlank private String assessmentSummary;
}
