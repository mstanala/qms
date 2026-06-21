package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ImplementationTaskResponse {
    private UUID id;
    private Integer taskNumber;
    private String title;
    private String description;
    private UserRef assignedTo;
    private String departmentName;
    private Instant dueDate;
    private Instant completedDate;
    private String status;
    private String comments;
}
