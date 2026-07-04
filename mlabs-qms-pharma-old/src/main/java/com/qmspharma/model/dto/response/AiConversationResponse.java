package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AiConversationResponse {
    private UUID id;
    private String title;
    private String status;
    private String moduleContext;
    private UUID recordId;
    private String recordType;
    private int messageCount;
    private Instant createdAt;
    private Instant updatedAt;
    private List<AiMessageResponse> messages;
}
