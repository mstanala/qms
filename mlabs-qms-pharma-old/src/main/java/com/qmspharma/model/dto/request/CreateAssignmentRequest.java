package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class CreateAssignmentRequest {
    @NotNull private UUID curriculumId;
    @NotNull private UUID assignedToId;
    @NotNull private String assignmentReason;
    @NotNull private Instant dueDate;
    private String priority;
    private UUID sourceRecordId;
    private String sourceRecordType;
    private String sourceRecordNumber;
}