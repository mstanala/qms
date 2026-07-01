package com.qmspharma.service.ai.agents;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.OpenAiLlmService;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

@Slf4j
public abstract class BaseAgent {

    protected final OpenAiLlmService llmService;

    protected BaseAgent(OpenAiLlmService llmService) {
        this.llmService = llmService;
    }

    public abstract AgentType getAgentType();
    public abstract String getDisplayName();
    public abstract String getDescription();

    public AgentResponse execute(AgentRequest request) {
        log.info("[{}] Executing action: {}", getAgentType(), request.getAction());
        long start = System.currentTimeMillis();

        try {
            String systemPrompt = getSystemPrompt();
            String context = buildContextPrompt(request);
            String fullMessage = context + "\n\nUser Query: " + request.getMessage();

            OpenAiLlmService.LlmResponse llmResponse = llmService.chat(
                    systemPrompt, fullMessage,
                    request.getModel(), List.of(), request.getTemperature());

            long latencyMs = System.currentTimeMillis() - start;

            return AgentResponse.builder()
                    .agentType(getAgentType())
                    .content(llmResponse.getContent())
                    .tokensUsed(llmResponse.getTokensUsed())
                    .latencyMs((int) latencyMs)
                    .model(llmResponse.getModel())
                    .success(llmResponse.getError() == null)
                    .error(llmResponse.getError())
                    .build();

        } catch (Exception e) {
            log.error("[{}] Execution failed", getAgentType(), e);
            return AgentResponse.builder()
                    .agentType(getAgentType())
                    .content("Agent execution failed: " + e.getMessage())
                    .latencyMs((int) (System.currentTimeMillis() - start))
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }

    protected abstract String getSystemPrompt();

    protected String buildContextPrompt(AgentRequest request) {
        StringBuilder sb = new StringBuilder();
        if (request.getModuleContext() != null) {
            sb.append("Module Context: ").append(request.getModuleContext()).append("\n");
        }
        if (request.getRecordType() != null && request.getRecordId() != null) {
            sb.append("Current Record: ").append(request.getRecordType())
              .append(" ID=").append(request.getRecordId()).append("\n");
        }
        if (request.getAdditionalContext() != null && !request.getAdditionalContext().isEmpty()) {
            sb.append("Additional Context:\n");
            request.getAdditionalContext().forEach((k, v) ->
                    sb.append("  ").append(k).append(": ").append(v).append("\n"));
        }
        return sb.toString();
    }

    @Data
    @lombok.Builder
    public static class AgentRequest {
        private String message;
        private String action;
        private String moduleContext;
        private java.util.UUID recordId;
        private String recordType;
        private String model;
        private double temperature;
        private Map<String, Object> additionalContext;
        private java.util.UUID userId;
    }

    @Data
    @lombok.Builder
    public static class AgentResponse {
        private AgentType agentType;
        private String content;
        private int tokensUsed;
        private int latencyMs;
        private String model;
        private boolean success;
        private String error;
        private List<ActionItem> suggestedActions;
        private Map<String, Object> data;
    }

    @Data
    @lombok.Builder
    public static class ActionItem {
        private String action;
        private String description;
        private boolean requiresApproval;
        private Map<String, Object> parameters;
    }
}
