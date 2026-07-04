package com.qmspharma.model.dto.request;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class UpdateCapaActionRequest {
    private String description;
    private String status;
    private UUID assignedToId;
    private Instant dueDate;
}
