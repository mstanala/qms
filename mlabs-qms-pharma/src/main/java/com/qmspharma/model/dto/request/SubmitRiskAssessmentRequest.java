package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitRiskAssessmentRequest {
    @NotNull @Min(1) @Max(5) private Integer severity;
    @NotNull @Min(1) @Max(5) private Integer occurrence;
    @NotNull @Min(1) @Max(5) private Integer detection;
    @NotNull private String riskLevel;
    @NotBlank private String justification;
}
