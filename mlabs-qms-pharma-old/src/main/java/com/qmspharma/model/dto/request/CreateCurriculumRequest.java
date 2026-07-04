package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateCurriculumRequest {
    @NotBlank private String title;
    private String description;
    @NotNull private String category;
    @NotNull private String trainingType;
    private UUID departmentId;
    private UUID plantSiteId;
    private BigDecimal durationHours;
    private Integer passingScore;
    private Integer validityMonths;
    private Boolean isMandatory;
    private String regulatoryRequirement;
    private String prerequisites;
    private UUID relatedDocumentId;
    private String status;
}