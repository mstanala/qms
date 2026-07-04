package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class WorkflowHistoryResponse {
    private UUID id;
    private String stepName;
    private String status;
    private UserRef assignedTo;
    private Instant startedAt;
    private Instant completedAt;
    private String comments;
    private Integer stepOrder;
}
