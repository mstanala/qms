package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AuditTrailResponse {
    private UUID id;
    private String recordType;
    private UUID recordId;
    private String recordNumber;
    private String action;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private String comments;
    private String reasonForChange;
    private UUID userId;
    private String userName;
    private String ipAddress;
    private Instant timestamp;
}
