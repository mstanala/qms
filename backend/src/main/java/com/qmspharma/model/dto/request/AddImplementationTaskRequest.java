package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class AddImplementationTaskRequest {
    @NotBlank private String title;
    private String description;
    @NotNull private UUID assignedToId;
    private UUID departmentId;
    @NotNull private Instant dueDate;
}
