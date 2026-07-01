package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class AddTrainingRequirementRequest {
    @NotBlank private String trainingTitle;
    private String targetAudience;
    private UUID departmentId;
    @NotNull private String trainingType;
    @NotNull private Instant dueDate;
}
