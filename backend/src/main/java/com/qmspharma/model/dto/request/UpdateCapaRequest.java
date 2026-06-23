package com.qmspharma.model.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateCapaRequest {
    private String title;
    private String description;
    private String type;
    private String priority;
    private String sourceType;
    private String sourceReference;
    private Instant targetCompletionDate;
    private UUID ownerId;
    private UUID departmentId;
    private UUID plantSiteId;
    private String product;
    private String batchNumber;
}
