package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class AiChatRequest {
    private UUID conversationId;

    @NotBlank(message = "Message is required")
    private String message;

    private String moduleContext;
    private UUID recordId;
    private String recordType;
}
