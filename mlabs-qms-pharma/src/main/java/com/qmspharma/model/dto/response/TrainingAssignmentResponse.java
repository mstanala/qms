package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TrainingAssignmentResponse {
    private UUID id;
    private UUID curriculumId;
    private String curriculumCode;
    private String curriculumTitle;
    private UserRef assignedTo;
    private UserRef assignedBy;
    private String assignmentReason;
    private Instant dueDate;
    private String priority;
    private String status;
    private String sourceRecordType;
    private UUID sourceRecordId;
    private String sourceRecordNumber;
    private Instant completedDate;
    private Integer score;
    private Integer attempts;
    private UserRef trainer;
    private String trainerComments;
    private String traineeComments;
    private Instant createdAt;
    private Instant updatedAt;
}