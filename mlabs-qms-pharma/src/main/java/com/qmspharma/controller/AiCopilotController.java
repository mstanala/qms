package com.qmspharma.controller;

import com.qmspharma.model.dto.request.AiChatRequest;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.model.entity.User;
import com.qmspharma.model.enums.AgentType;
import com.qmspharma.repository.AiAgentConfigRepository;
import com.qmspharma.repository.AiAuditLogRepository;
import com.qmspharma.security.CurrentUserProvider;
import com.qmspharma.service.ai.AiConversationService;
import com.qmspharma.service.ai.AiDashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiCopilotController {

    private final AiConversationService conversationService;
    private final AiDashboardService dashboardService;
    private final AiAgentConfigRepository agentConfigRepository;
    private final AiAuditLogRepository auditLogRepository;
    private final CurrentUserProvider currentUserProvider;

    // ─── Chat ───

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        User user = currentUserProvider.getCurrentUser();
        AiChatResponse response = conversationService.processMessage(request, user);
        return ResponseEntity.ok(response);
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
}
