package com.qmspharma.model.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateDeviationRequest {
    private String title;
    private String description;
    private String type;
    private String category;
    private String classification;
    private String sourceArea;
    private Instant occurredDate;
    private Instant detectedDate;
    private Instant targetClosureDate;
    private UUID plantSiteId;
    private UUID departmentId;
    private UUID assignedToId;
    private String area;
    private String equipment;
    private String product;
    private String batchNumber;
    private Boolean gmpImpact;
    private Boolean patientSafetyImpact;
    private Boolean regulatoryImpact;
}
