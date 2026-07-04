package com.qmspharma.service.ai;

import com.qmspharma.model.dto.response.AiAgentConfigResponse;
import com.qmspharma.model.dto.response.AiDashboardResponse;
import com.qmspharma.model.enums.AgentExecutionStatus;
import com.qmspharma.model.enums.AiSuggestionStatus;
import com.qmspharma.model.enums.ConversationStatus;
import com.qmspharma.repository.AiAgentConfigRepository;
import com.qmspharma.repository.AiAgentExecutionRepository;
import com.qmspharma.repository.AiConversationRepository;
import com.qmspharma.repository.AiMessageRepository;
import com.qmspharma.repository.AiSuggestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiDashboardService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiAgentExecutionRepository executionRepository;
    private final AiAgentConfigRepository agentConfigRepository;
    private final AiSuggestionRepository suggestionRepository;

    @Transactional(readOnly = true)
    public AiDashboardResponse getDashboard(UUID userId) {
        Instant todayStart = Instant.now().truncatedTo(ChronoUnit.DAYS);

        // Execution stats by agent type
        Map<String, Long> byAgent = new LinkedHashMap<>();
        for (Object[] row : executionRepository.countByAgentTypeGrouped()) {
            byAgent.put(row[0].toString(), (Long) row[1]);
        }

        // Execution stats by status
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : executionRepository.countByStatusGrouped()) {
            byStatus.put(row[0].toString(), (Long) row[1]);
        }

        // Agent configs
        var agents = agentConfigRepository.findAllByOrderByAgentTypeAsc().stream()
                .map(c -> AiAgentConfigResponse.builder()
                        .id(c.getId())
                        .agentType(c.getAgentType().name())
                        .displayName(c.getDisplayName())
                        .description(c.getDescription())
                        .isEnabled(c.getIsEnabled())
                        .modelId(c.getModelId())
                        .temperature(c.getTemperature())
                        .maxTokens(c.getMaxTokens())
                        .toolsEnabled(c.getToolsEnabled())
                        .rateLimitRpm(c.getRateLimitRpm())
                        .requiresApprovalFor(c.getRequiresApprovalFor())
                        .build())
                .collect(Collectors.toList());

        long totalTokens = messageRepository.totalTokensByUser(userId);

        // Suggestion stats
        long pendingSuggestions = suggestionRepository.countByStatus(AiSuggestionStatus.PENDING);
        long acceptedSuggestions = suggestionRepository.countByStatus(AiSuggestionStatus.ACCEPTED);
        long rejectedSuggestions = suggestionRepository.countByStatus(AiSuggestionStatus.REJECTED);

        Map<String, Map<String, Long>> suggestionsByAgentAndStatus = new LinkedHashMap<>();
        for (Object[] row : suggestionRepository.countByAgentTypeAndStatusGrouped()) {
            String agent = row[0].toString();
            String status = row[1].toString();
            Long count = (Long) row[2];
            suggestionsByAgentAndStatus
                    .computeIfAbsent(agent, k -> new LinkedHashMap<>())
                    .put(status, count);
        }

        return AiDashboardResponse.builder()
                .totalConversations(conversationRepository.count())
                .totalMessages(messageRepository.count())
                .totalAgentExecutions(executionRepository.count())
                .activeConversations(conversationRepository.countByUserIdAndStatus(userId, ConversationStatus.ACTIVE))
                .executionsToday(executionRepository.countByCreatedAtAfter(todayStart))
                .failedExecutions(executionRepository.countByStatus(AgentExecutionStatus.FAILED))
                .pendingApprovals(executionRepository.countByStatusAndRequiresApproval(
                        AgentExecutionStatus.RUNNING, true))
                .executionsByAgent(byAgent)
                .executionsByStatus(byStatus)
                .agents(agents)
                .avgLatencyMs(executionRepository.averageLatency())
                .totalTokensUsed(totalTokens)
                .pendingSuggestions(pendingSuggestions)
                .acceptedSuggestions(acceptedSuggestions)
                .rejectedSuggestions(rejectedSuggestions)
                .suggestionsByAgentAndStatus(suggestionsByAgentAndStatus)
                .build();
    }
}
