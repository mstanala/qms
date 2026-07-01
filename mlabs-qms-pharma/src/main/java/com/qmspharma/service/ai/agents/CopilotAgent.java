package com.qmspharma.service.ai.agents;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.OpenAiLlmService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CopilotAgent extends BaseAgent {

    public CopilotAgent(OpenAiLlmService llmService) {
        super(llmService);
    }

    @Override
    public AgentType getAgentType() {
        return AgentType.COPILOT;
    }

    @Override
    public String getDisplayName() {
        return "AI Copilot";
    }

    @Override
    public String getDescription() {
        return "General-purpose QMS assistant for navigation, search, regulatory guidance, and cross-module insights";
    }

    @Override
    protected String getSystemPrompt() {
        return """
            You are the QMS-Pharma AI Copilot, an intelligent assistant for pharmaceutical quality management professionals.

            You help users with:
            - Navigating the QMS system and finding records (CAPA, Deviations, Change Controls, Documents, Training, Audits, Risk, Complaints, Suppliers, Nonconformances, Equipment)
            - Understanding regulatory requirements (FDA 21 CFR Parts 210/211, ICH Q10, WHO GMP, Schedule M)
            - Explaining quality workflows and processes
            - Providing data-driven insights and trend analysis
            - Root cause analysis guidance (5-Why, Fishbone, Fault Tree)
            - Risk assessment using ICH Q9 principles

            Important guidelines:
            - Always cite specific regulations when discussing compliance
            - Flag when actions require electronic signatures or approvals per 21 CFR Part 11
            - Never make changes without explicit user confirmation
            - Provide concise, actionable responses
            - When unsure, recommend consulting with a qualified person (QP)
            - Use record numbers (e.g., CAPA-2024-001, DEV-2024-005) when referencing specific records

            If the user's question is specific to a domain (CAPA, Deviation, etc.), provide domain-specific guidance.
            If the question requires data analysis, explain what analysis you would perform.
            """;
    }

    @Override
    public AgentResponse execute(AgentRequest request) {
        // For copilot, use conversation history if available
        if (request.getAdditionalContext() != null &&
            request.getAdditionalContext().containsKey("conversationHistory")) {
            @SuppressWarnings("unchecked")
            List<OpenAiLlmService.ChatMessage> history =
                    (List<OpenAiLlmService.ChatMessage>) request.getAdditionalContext().get("conversationHistory");

            // Add current message to history
            history.add(OpenAiLlmService.ChatMessage.builder()
                    .role("user").content(request.getMessage()).build());

            long start = System.currentTimeMillis();
            OpenAiLlmService.LlmResponse response = llmService.chatWithHistory(
                    getSystemPrompt(), history, request.getModel(), request.getTemperature());

            return AgentResponse.builder()
                    .agentType(getAgentType())
                    .content(response.getContent())
                    .tokensUsed(response.getTokensUsed())
                    .latencyMs((int) (System.currentTimeMillis() - start))
                    .model(response.getModel())
                    .success(response.getError() == null)
                    .error(response.getError())
                    .build();
        }
        return super.execute(request);
    }
}
