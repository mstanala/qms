package com.qmspharma.service.ai.agents;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.OpenAiLlmService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class SupervisorAgent extends BaseAgent {

    private final ObjectMapper objectMapper;

    public SupervisorAgent(OpenAiLlmService llmService, ObjectMapper objectMapper) {
        super(llmService);
        this.objectMapper = objectMapper;
    }

    @Override
    public AgentType getAgentType() {
        return AgentType.SUPERVISOR;
    }

    @Override
    public String getDisplayName() {
        return "AI Supervisor";
    }

    @Override
    public String getDescription() {
        return "Orchestrates all domain agents, routes requests, and provides cross-module intelligence";
    }

    @Override
    protected String getSystemPrompt() {
        return """
            You are the QMS-Pharma AI Supervisor Agent. You analyze user requests and determine which specialized domain agent should handle them.

            Available domain agents:
            - CAPA_AGENT: CAPA management, root cause analysis, corrective/preventive actions, effectiveness
            - DEVIATION_AGENT: Deviation reporting, investigation, classification, impact assessment
            - CHANGE_CONTROL_AGENT: Change requests, impact assessment, implementation planning
            - DOCUMENT_AGENT: Document lifecycle, reviews, compliance checking
            - TRAINING_AGENT: Training assignments, gap analysis, curriculum management
            - AUDIT_AGENT: Audit planning, checklists, finding analysis
            - RISK_AGENT: Risk assessment, FMEA, RPN calculation, controls
            - COMPLAINT_AGENT: Complaint intake, classification, reportability, trending
            - SUPPLIER_AGENT: Supplier evaluation, qualification, performance monitoring
            - NC_AGENT: Nonconformance classification, disposition, trending
            - EQUIPMENT_AGENT: Equipment qualification, calibration, maintenance
            - COPILOT: General QMS guidance, navigation, regulatory questions (default for unclear requests)

            RESPONSE FORMAT: You MUST respond with a JSON object containing:
            {
              "targetAgent": "AGENT_TYPE",
              "reasoning": "brief explanation of why this agent was selected",
              "refinedQuery": "the refined query to pass to the target agent",
              "crossModuleContext": "any cross-module context that would help the target agent"
            }

            Routing rules:
            1. If the query clearly belongs to one domain, route to that agent
            2. If the query spans multiple domains, route to the primary domain and include cross-module context
            3. If the query is general QMS guidance, regulatory, or unclear, route to COPILOT
            4. For "create" or "modify" requests, route to the appropriate domain agent
            5. For search/analysis across modules, route to COPILOT with cross-module context
            """;
    }

    public RoutingDecision route(String userMessage, String moduleContext) {
        String contextInfo = moduleContext != null ?
                "Current Module Context: " + moduleContext + "\n\n" : "";

        OpenAiLlmService.LlmResponse response = llmService.chat(
                getSystemPrompt(),
                contextInfo + "User Request: " + userMessage,
                null, java.util.List.of(), 0.2);

        try {
            String content = response.getContent().trim();
            // Extract JSON from response (handle markdown code blocks)
            if (content.contains("```json")) {
                content = content.substring(content.indexOf("```json") + 7);
                content = content.substring(0, content.indexOf("```"));
            } else if (content.contains("```")) {
                content = content.substring(content.indexOf("```") + 3);
                content = content.substring(0, content.indexOf("```"));
            }

            @SuppressWarnings("unchecked")
            Map<String, String> parsed = objectMapper.readValue(content.trim(), Map.class);

            String agentTypeStr = parsed.getOrDefault("targetAgent", "COPILOT");
            AgentType targetAgent;
            try {
                targetAgent = AgentType.valueOf(agentTypeStr);
            } catch (IllegalArgumentException e) {
                targetAgent = AgentType.COPILOT;
            }

            return RoutingDecision.builder()
                    .targetAgent(targetAgent)
                    .reasoning(parsed.getOrDefault("reasoning", ""))
                    .refinedQuery(parsed.getOrDefault("refinedQuery", userMessage))
                    .crossModuleContext(parsed.getOrDefault("crossModuleContext", ""))
                    .tokensUsed(response.getTokensUsed())
                    .build();

        } catch (Exception e) {
            log.warn("Failed to parse supervisor routing response, defaulting to COPILOT", e);
            return RoutingDecision.builder()
                    .targetAgent(AgentType.COPILOT)
                    .reasoning("Could not determine specific domain, routing to general copilot")
                    .refinedQuery(userMessage)
                    .tokensUsed(response.getTokensUsed())
                    .build();
        }
    }

    @lombok.Data
    @lombok.Builder
    public static class RoutingDecision {
        private AgentType targetAgent;
        private String reasoning;
        private String refinedQuery;
        private String crossModuleContext;
        private int tokensUsed;
    }
}
