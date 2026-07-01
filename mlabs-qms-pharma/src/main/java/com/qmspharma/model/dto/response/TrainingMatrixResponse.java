package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TrainingMatrixResponse {
    private UUID id;
    private UUID roleId;
    private String roleName;
    private UUID curriculumId;
    private String curriculumCode;
    private String curriculumTitle;
    private UUID departmentId;
    private String departmentName;
    private Boolean isMandatory;
    private Integer frequencyMonths;
    private Instant effectiveDate;
}