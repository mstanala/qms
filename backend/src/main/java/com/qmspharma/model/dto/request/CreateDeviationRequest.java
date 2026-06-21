package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class CreateDeviationRequest {
    @NotBlank private String title;
    @NotBlank private String description;
    @NotNull private String type;
    @NotNull private String category;
    @NotNull private Instant occurredDate;
    @NotNull private Instant detectedDate;
    @NotNull private Instant targetClosureDate;
    @NotNull private UUID plantSiteId;
    @NotNull private UUID departmentId;
    private String area;
    private String equipment;
    private String product;
    private String batchNumber;
    private String batchSize;
    private List<String> affectedBatches;
    private Boolean gmpImpact;
    private Boolean patientSafetyImpact;
    private Boolean regulatoryImpact;
    private String sourceArea;
}
