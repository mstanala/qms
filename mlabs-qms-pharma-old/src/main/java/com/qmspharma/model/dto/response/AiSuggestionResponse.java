package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class AiSuggestionResponse {
    private UUID id;
    private String type;
    private String sourceModule;
    private UUID sourceRecordId;
    private String sourceRecordNumber;
    private String targetModule;
    private UUID targetRecordId;
    private Map<String, Object> suggestion;
    private BigDecimal confidence;
    private String reasoning;
    private String status;
    private String agentType;
    private String assignedToName;
    private UUID assignedToId;
    private String reviewedByName;
    private Instant reviewedAt;
    private String reviewComments;
    private Map<String, Object> humanModification;
    private boolean requiresESignature;
    private Instant autoExpireAt;
    private Instant createdAt;
}
