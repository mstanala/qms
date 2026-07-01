package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AiDashboardResponse {
    private long totalConversations;
    private long totalMessages;
    private long totalAgentExecutions;
    private long activeConversations;
    private long executionsToday;
    private long failedExecutions;
    private long pendingApprovals;
    private Map<String, Long> executionsByAgent;
    private Map<String, Long> executionsByStatus;
    private List<AiAgentConfigResponse> agents;
    private double avgLatencyMs;
    private long totalTokensUsed;
}
