package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class CreateCapaRequest {
    @NotBlank private String title;
    @NotBlank private String description;
    @NotNull private String type;
    @NotNull private String priority;
    @NotNull private String sourceType;
    private String sourceReference;
    @NotNull private Instant targetCompletionDate;
    @NotNull private UUID ownerId;
    @NotNull private UUID departmentId;
    @NotNull private UUID plantSiteId;
    private String product;
    private String batchNumber;
    private UUID deviationId;
}
