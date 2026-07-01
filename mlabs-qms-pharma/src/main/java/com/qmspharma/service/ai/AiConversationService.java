package com.qmspharma.service.ai;

import com.qmspharma.exception.ResourceNotFoundException;
import com.qmspharma.model.dto.request.AiChatRequest;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.model.entity.*;
import com.qmspharma.model.enums.*;
import com.qmspharma.repository.*;
import com.qmspharma.service.ai.agents.BaseAgent;
import com.qmspharma.service.ai.agents.SupervisorAgent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiConversationService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiAgentExecutionRepository executionRepository;
    private final AiAuditLogRepository auditLogRepository;
    private final AiAgentConfigRepository agentConfigRepository;
    private final AgentRegistry agentRegistry;
    private final SupervisorAgent supervisorAgent;

    @Transactional
    public AiChatResponse processMessage(AiChatRequest request, User currentUser) {
        long overallStart = System.currentTimeMillis();

        // Get or create conversation
        AiConversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        } else {
            conversation = new AiConversation();
            conversation.setUser(currentUser);
            conversation.setStatus(ConversationStatus.ACTIVE);
            conversation.setModuleContext(request.getModuleContext());
            conversation.setRecordId(request.getRecordId());
            conversation.setRecordType(request.getRecordType());
            conversation.setTitle(generateTitle(request.getMessage()));
            conversation = conversationRepository.save(conversation);
        }

        // Save user message
        AiMessage userMessage = new AiMessage();
        userMessage.setConversation(conversation);
        userMessage.setRole(MessageRole.USER);
        userMessage.setContent(request.getMessage());
        messageRepository.save(userMessage);

        // Route through supervisor to determine target agent
        SupervisorAgent.RoutingDecision routing = supervisorAgent.route(
                request.getMessage(), request.getModuleContext());

        log.info("Supervisor routed to {} - Reason: {}", routing.getTargetAgent(), routing.getReasoning());

        // Check if target agent is enabled
        AgentType targetType = routing.getTargetAgent();
        Optional<AiAgentConfig> agentConfig = agentConfigRepository.findByAgentType(targetType);
        if (agentConfig.isPresent() && !agentConfig.get().getIsEnabled()) {
            targetType = AgentType.COPILOT; // Fallback to copilot
        }

        // Get conversation history for context
        List<OpenAiLlmService.ChatMessage> history = getConversationHistory(conversation.getId());

        // Execute target agent
        BaseAgent agent = agentRegistry.getAgent(targetType);
        Map<String, Object> additionalContext = new HashMap<>();
        additionalContext.put("conversationHistory", history);
        if (routing.getCrossModuleContext() != null && !routing.getCrossModuleContext().isEmpty()) {
            additionalContext.put("crossModuleContext", routing.getCrossModuleContext());
        }

        BaseAgent.AgentRequest agentRequest = BaseAgent.AgentRequest.builder()
                .message(routing.getRefinedQuery())
                .action("chat")
                .moduleContext(request.getModuleContext())
                .recordId(request.getRecordId())
                .recordType(request.getRecordType())
                .model(agentConfig.map(AiAgentConfig::getModelId).orElse("gpt-5-mini"))
                .temperature(agentConfig.map(c -> c.getTemperature().doubleValue()).orElse(0.3))
                .additionalContext(additionalContext)
                .userId(currentUser.getId())
                .build();

        BaseAgent.AgentResponse agentResponse = agent.execute(agentRequest);

        // Save assistant message
        AiMessage assistantMessage = new AiMessage();
        assistantMessage.setConversation(conversation);
        assistantMessage.setRole(MessageRole.ASSISTANT);
        assistantMessage.setContent(agentResponse.getContent());
        assistantMessage.setAgentType(agentResponse.getAgentType());
        assistantMessage.setTokensUsed(agentResponse.getTokensUsed());
        assistantMessage.setModelId(agentResponse.getModel());
        assistantMessage.setLatencyMs(agentResponse.getLatencyMs());
        messageRepository.save(assistantMessage);

        // Record agent execution
        AiAgentExecution execution = new AiAgentExecution();
        execution.setConversation(conversation);
        execution.setMessage(assistantMessage);
        execution.setAgentType(agentResponse.getAgentType());
        execution.setAgentAction("chat");
        execution.setInputSummary(truncate(request.getMessage(), 500));
        execution.setOutputSummary(truncate(agentResponse.getContent(), 500));
        execution.setStatus(agentResponse.isSuccess() ? AgentExecutionStatus.COMPLETED : AgentExecutionStatus.FAILED);
        execution.setErrorMessage(agentResponse.getError());
        execution.setTokensInput(routing.getTokensUsed());
        execution.setTokensOutput(agentResponse.getTokensUsed());
        execution.setLatencyMs(agentResponse.getLatencyMs());
        execution.setInitiatedBy(currentUser);
        execution.setCompletedAt(Instant.now());
        executionRepository.save(execution);

        // Record AI audit trail
        AiAuditLog auditLog = new AiAuditLog();
        auditLog.setExecution(execution);
        auditLog.setUser(currentUser);
        auditLog.setAgentType(agentResponse.getAgentType());
        auditLog.setAction("CHAT_RESPONSE");
        auditLog.setRecordType(request.getRecordType());
        auditLog.setRecordId(request.getRecordId());
        auditLog.setDescription("AI " + agentResponse.getAgentType() + " responded to user query");
        auditLogRepository.save(auditLog);

        // Update conversation timestamp
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        int totalLatency = (int) (System.currentTimeMillis() - overallStart);

        // Build response
        List<AiChatResponse.AgentAction> actions = new ArrayList<>();
        actions.add(AiChatResponse.AgentAction.builder()
                .agentType(routing.getTargetAgent().name())
                .action("chat")
                .summary(routing.getReasoning())
                .requiresApproval(false)
                .build());

        return AiChatResponse.builder()
                .conversationId(conversation.getId())
                .messageId(assistantMessage.getId())
                .content(agentResponse.getContent())
                .agentType(agentResponse.getAgentType().name())
                .agentActions(actions)
                .tokensUsed(agentResponse.getTokensUsed() + routing.getTokensUsed())
                .latencyMs(totalLatency)
                .timestamp(Instant.now())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<AiConversationResponse> getUserConversations(UUID userId, Pageable pageable) {
        return conversationRepository
                .findByUserIdAndStatusNotOrderByUpdatedAtDesc(userId, ConversationStatus.DELETED, pageable)
                .map(this::toConversationResponse);
    }

    @Transactional(readOnly = true)
    public AiConversationResponse getConversation(UUID conversationId) {
        AiConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        AiConversationResponse response = toConversationResponse(conv);
        response.setMessages(conv.getMessages().stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList()));
        return response;
    }

    @Transactional
    public void archiveConversation(UUID conversationId) {
        AiConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        conv.setStatus(ConversationStatus.ARCHIVED);
        conversationRepository.save(conv);
    }

    @Transactional
    public void deleteConversation(UUID conversationId) {
        AiConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        conv.setStatus(ConversationStatus.DELETED);
        conversationRepository.save(conv);
    }

    private List<OpenAiLlmService.ChatMessage> getConversationHistory(UUID conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .filter(m -> m.getRole() == MessageRole.USER || m.getRole() == MessageRole.ASSISTANT)
                .map(m -> OpenAiLlmService.ChatMessage.builder()
                        .role(m.getRole() == MessageRole.USER ? "user" : "assistant")
                        .content(m.getContent())
                        .build())
                .collect(Collectors.toList());
    }

    private String generateTitle(String message) {
        if (message.length() <= 80) return message;
        return message.substring(0, 77) + "...";
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return null;
        return text.length() <= maxLen ? text : text.substring(0, maxLen - 3) + "...";
    }

    private AiConversationResponse toConversationResponse(AiConversation conv) {
        return AiConversationResponse.builder()
                .id(conv.getId())
                .title(conv.getTitle())
                .status(conv.getStatus().name())
                .moduleContext(conv.getModuleContext())
                .recordId(conv.getRecordId())
                .recordType(conv.getRecordType())
                .messageCount(conv.getMessages() != null ? conv.getMessages().size() : 0)
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build();
    }

    private AiMessageResponse toMessageResponse(AiMessage msg) {
        return AiMessageResponse.builder()
                .id(msg.getId())
                .role(msg.getRole().name())
                .content(msg.getContent())
                .agentType(msg.getAgentType() != null ? msg.getAgentType().name() : null)
                .toolCalls(msg.getToolCalls())
                .tokensUsed(msg.getTokensUsed())
                .modelId(msg.getModelId())
                .latencyMs(msg.getLatencyMs())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
