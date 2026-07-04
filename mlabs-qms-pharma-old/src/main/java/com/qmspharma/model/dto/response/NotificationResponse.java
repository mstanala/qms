package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String title;
    private String message;
    private String notificationType;
    private String recordType;
    private UUID recordId;
    private String recordNumber;
    private Boolean isRead;
    private Instant readAt;
    private String priority;
    private Instant createdAt;
}
