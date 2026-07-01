package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CapaActionResponse {
    private UUID id;
    private String actionNumber;
    private String description;
    private String type;
    private String status;
    private UserRef assignedTo;
    private Instant dueDate;
    private Instant completedDate;
    private String evidence;
    private UserRef verifiedBy;
    private Instant verifiedDate;
    private String verificationComments;
}
