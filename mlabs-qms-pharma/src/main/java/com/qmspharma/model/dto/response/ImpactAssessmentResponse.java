package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ImpactAssessmentResponse {
    private UUID id;
    private String productQualityImpact;
    private String patientSafetyImpact;
    private String regulatoryImpact;
    private String businessImpact;
    private String overallRiskLevel;
    private List<String> affectedProducts;
    private List<String> affectedBatches;
    private String batchDisposition;
    private String justification;
    private UserRef assessedBy;
    private Instant assessedDate;
}
