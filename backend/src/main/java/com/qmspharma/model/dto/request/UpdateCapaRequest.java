package com.qmspharma.model.dto.request;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class UpdateCapaRequest {
    private String title;
    private String description;
    private String type;
    private String priority;
    private Instant targetCompletionDate;
    private UUID ownerId;
    private String product;
    private String batchNumber;
}
