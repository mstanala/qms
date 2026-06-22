package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TrainingRequirementResponse {
    private UUID id;
    private String trainingTitle;
    private String targetAudience;
    private String departmentName;
    private String trainingType;
    private Instant dueDate;
    private String completionStatus;
    private Integer completionPercentage;
}
