package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DocumentReviewResponse {
    private UUID id;
    private String reviewType;
    private Instant reviewDueDate;
    private Instant reviewCompletedDate;
    private UserRef reviewer;
    private String reviewDecision;
    private String comments;
    private Instant nextReviewDate;
    private String status;
    private Instant createdAt;
}