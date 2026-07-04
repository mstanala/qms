package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class AiMessageResponse {
    private UUID id;
    private String role;
    private String content;
    private String agentType;
    private List<Map<String, Object>> toolCalls;
    private Integer tokensUsed;
    private String modelId;
    private Integer latencyMs;
    private Instant createdAt;
}
