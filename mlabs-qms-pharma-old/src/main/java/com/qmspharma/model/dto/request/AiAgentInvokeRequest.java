package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
public class AiAgentInvokeRequest {
    @NotBlank(message = "Message is required")
    private String message;

    private String action;
    private UUID recordId;
    private String recordType;
    private Map<String, Object> context;
}
