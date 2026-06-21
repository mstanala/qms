package com.qmspharma.model.dto.request;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class UpdateDeviationRequest {
    private String title;
    private String description;
    private String type;
    private String category;
    private Instant targetClosureDate;
    private UUID assignedToId;
    private String area;
    private String equipment;
    private String product;
    private String batchNumber;
    private Boolean gmpImpact;
    private Boolean patientSafetyImpact;
    private Boolean regulatoryImpact;
}
