package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SubmitImpactAssessmentRequest {
    @NotNull private String productQualityImpact;
    @NotNull private String patientSafetyImpact;
    @NotNull private String regulatoryImpact;
    @NotNull private String businessImpact;
    @NotNull private String overallRiskLevel;
    private List<String> affectedProducts;
    private List<String> affectedBatches;
    private String batchDisposition;
    @NotBlank private String justification;
}
