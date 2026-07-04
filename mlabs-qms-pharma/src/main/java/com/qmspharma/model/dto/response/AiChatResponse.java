package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class AiChatResponse {
    private UUID conversationId;
    private UUID messageId;
    private String content;
    private String agentType;
    private List<AgentAction> agentActions;
    private Integer tokensUsed;
    private Integer latencyMs;
    private Instant timestamp;

    @Data
    @Builder
    public static class AgentAction {
        private String agentType;
        private String action;
        private String summary;
        private boolean requiresApproval;
        private Map<String, Object> data;
    }
}
