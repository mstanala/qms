package com.qmspharma.controller;

import com.qmspharma.model.dto.request.AiAgentInvokeRequest;
import com.qmspharma.model.dto.request.AiChatRequest;
import com.qmspharma.model.dto.request.AiSuggestionReviewRequest;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.model.entity.AiAgentConfig;
import com.qmspharma.model.entity.User;
import com.qmspharma.model.enums.AgentType;
import com.qmspharma.repository.AiAgentConfigRepository;
import com.qmspharma.repository.AiAuditLogRepository;
import com.qmspharma.repository.AiSuggestionRepository;
import com.qmspharma.security.CurrentUserProvider;
import com.qmspharma.service.ai.AgentRegistry;
import com.qmspharma.service.ai.AiConversationService;
import com.qmspharma.service.ai.AiDashboardService;
import com.qmspharma.service.ai.AiSuggestionService;
import com.qmspharma.service.ai.agents.BaseAgent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiCopilotController {

    private final AiConversationService conversationService;
    private final AiDashboardService dashboardService;
    private final AiSuggestionService suggestionService;
    private final AgentRegistry agentRegistry;
    private final AiAgentConfigRepository agentConfigRepository;
    private final AiAuditLogRepository auditLogRepository;
    private final AiSuggestionRepository suggestionRepository;
    private final CurrentUserProvider currentUserProvider;

    // ─── Chat ───

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        User user = currentUserProvider.getCurrentUser();
        AiChatResponse response = conversationService.processMessage(request, user);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/chat/stream", produces = "text/event-stream")
    public SseEmitter chatStream(@Valid @RequestBody AiChatRequest request) {
        User user = currentUserProvider.getCurrentUser();
        return conversationService.processMessageStreaming(request, user);
    }

    // ─── Conversations ───

    @GetMapping("/conversations")
    public ResponseEntity<Page<AiConversationResponse>> getConversations(Pageable pageable) {
        User user = currentUserProvider.getCurrentUser();
        return ResponseEntity.ok(conversationService.getUserConversations(user.getId(), pageable));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<AiConversationResponse> getConversation(@PathVariable UUID id) {
        return ResponseEntity.ok(conversationService.getConversation(id));
    }

    @PatchMapping("/conversations/{id}/archive")
    public ResponseEntity<Void> archiveConversation(@PathVariable UUID id) {
        conversationService.archiveConversation(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable UUID id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Dashboard ───

    @GetMapping("/dashboard")
    public ResponseEntity<AiDashboardResponse> getDashboard() {
        User user = currentUserProvider.getCurrentUser();
        return ResponseEntity.ok(dashboardService.getDashboard(user.getId()));
    }

    // ─── Agent Configuration ───

    @GetMapping("/agents")
    public ResponseEntity<?> getAgentConfigs() {
        var configs = agentConfigRepository.findAllByOrderByAgentTypeAsc().stream()
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
        return ResponseEntity.ok(configs);
    }

    @PatchMapping("/agents/{id}/toggle")
    public ResponseEntity<Void> toggleAgent(@PathVariable UUID id, @RequestParam boolean enabled) {
        agentConfigRepository.findById(id).ifPresent(config -> {
            config.setIsEnabled(enabled);
            agentConfigRepository.save(config);
        });
        return ResponseEntity.noContent().build();
    }

    // ─── AI Audit Trail ───

    @GetMapping("/audit-trail")
    public ResponseEntity<?> getAiAuditTrail(
            @RequestParam(required = false) String agentType,
            @RequestParam(required = false) String recordType,
            @RequestParam(required = false) UUID recordId,
            Pageable pageable) {
        if (agentType != null) {
            return ResponseEntity.ok(
                    auditLogRepository.findByAgentTypeOrderByCreatedAtDesc(AgentType.valueOf(agentType), pageable));
        }
        if (recordType != null && recordId != null) {
            return ResponseEntity.ok(
                    auditLogRepository.findByRecordTypeAndRecordIdOrderByCreatedAtDesc(recordType, recordId, pageable));
        }
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc(pageable));
    }

    // ─── Direct Agent Invocation ───

    @PostMapping("/agents/{agentName}/invoke")
    public ResponseEntity<AiChatResponse> invokeAgent(
            @PathVariable String agentName,
            @Valid @RequestBody AiAgentInvokeRequest request) {
        User user = currentUserProvider.getCurrentUser();

        AgentType agentType = AgentType.valueOf(agentName.toUpperCase());
        Optional<AiAgentConfig> config = agentConfigRepository.findByAgentType(agentType);
        if (config.isPresent() && !config.get().getIsEnabled()) {
            return ResponseEntity.badRequest().build();
        }

        BaseAgent agent = agentRegistry.getAgent(agentType);
        BaseAgent.AgentRequest agentRequest = BaseAgent.AgentRequest.builder()
                .message(request.getMessage())
                .action(request.getAction() != null ? request.getAction() : "invoke")
                .recordId(request.getRecordId())
                .recordType(request.getRecordType())
                .model(config.map(AiAgentConfig::getModelId).orElse("gpt-5-mini"))
                .temperature(config.map(c -> c.getTemperature().doubleValue()).orElse(0.3))
                .additionalContext(request.getContext() != null ? request.getContext() : Map.of())
                .userId(user.getId())
                .build();

        BaseAgent.AgentResponse agentResponse = agent.execute(agentRequest);

        return ResponseEntity.ok(AiChatResponse.builder()
                .content(agentResponse.getContent())
                .agentType(agentResponse.getAgentType().name())
                .tokensUsed(agentResponse.getTokensUsed())
                .latencyMs(agentResponse.getLatencyMs())
                .build());
    }

    @GetMapping("/agents/{agentName}/tools")
    public ResponseEntity<?> getAgentTools(@PathVariable String agentName) {
        AgentType agentType = AgentType.valueOf(agentName.toUpperCase());
        Optional<AiAgentConfig> config = agentConfigRepository.findByAgentType(agentType);
        return config.map(c -> ResponseEntity.ok(Map.of(
                "agentType", c.getAgentType().name(),
                "displayName", c.getDisplayName(),
                "tools", c.getToolsEnabled(),
                "requiresApprovalFor", c.getRequiresApprovalFor()
        ))).orElse(ResponseEntity.notFound().build());
    }

    // ─── AI Suggestions (Human-in-the-Loop) ───

    @GetMapping("/suggestions")
    public ResponseEntity<Page<AiSuggestionResponse>> getSuggestions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sourceModule,
            @RequestParam(required = false) UUID sourceRecordId,
            @RequestParam(required = false, defaultValue = "false") boolean myPending,
            Pageable pageable) {
        User user = currentUserProvider.getCurrentUser();

        if (sourceModule != null && sourceRecordId != null) {
            return ResponseEntity.ok(suggestionService.getSuggestionsByRecord(sourceModule, sourceRecordId, pageable));
        }
        if (myPending) {
            return ResponseEntity.ok(suggestionService.getPendingSuggestions(user.getId(), pageable));
        }
        return ResponseEntity.ok(suggestionService.getPendingSuggestions(null, pageable));
    }

    @GetMapping("/suggestions/{id}")
    public ResponseEntity<AiSuggestionResponse> getSuggestion(@PathVariable UUID id) {
        return ResponseEntity.ok(suggestionService.getSuggestion(id));
    }

    @PutMapping("/suggestions/{id}/review")
    public ResponseEntity<AiSuggestionResponse> reviewSuggestion(
            @PathVariable UUID id,
            @Valid @RequestBody AiSuggestionReviewRequest request) {
        User user = currentUserProvider.getCurrentUser();
        return ResponseEntity.ok(suggestionService.reviewSuggestion(id, request, user));
    }

    @GetMapping("/suggestions/count")
    public ResponseEntity<?> getSuggestionCounts() {
        User user = currentUserProvider.getCurrentUser();
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("totalPending", suggestionRepository.countByStatus(
                com.qmspharma.model.enums.AiSuggestionStatus.PENDING));
        counts.put("myPending", suggestionRepository.countByAssignedToIdAndStatus(
                user.getId(), com.qmspharma.model.enums.AiSuggestionStatus.PENDING));
        return ResponseEntity.ok(counts);
    }
}
