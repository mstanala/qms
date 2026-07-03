package com.qmspharma.service.ai;

import com.qmspharma.exception.BusinessRuleException;
import com.qmspharma.exception.ResourceNotFoundException;
import com.qmspharma.model.dto.request.AiSuggestionReviewRequest;
import com.qmspharma.model.dto.request.VerifyESignatureRequest;
import com.qmspharma.model.dto.response.AiSuggestionResponse;
import com.qmspharma.model.entity.*;
import com.qmspharma.model.enums.AgentType;
import com.qmspharma.model.enums.AiSuggestionStatus;
import com.qmspharma.repository.AiAuditLogRepository;
import com.qmspharma.repository.AiSuggestionRepository;
import com.qmspharma.service.ESignatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSuggestionService {

    private final AiSuggestionRepository suggestionRepository;
    private final AiAuditLogRepository auditLogRepository;
    private final ESignatureService eSignatureService;

    @Transactional
    public AiSuggestion createSuggestion(String type, String sourceModule, UUID sourceRecordId,
                                          String sourceRecordNumber, Map<String, Object> suggestion,
                                          BigDecimal confidence, String reasoning, AgentType agentType,
                                          AiAgentExecution execution, User assignedTo, User createdBy,
                                          boolean requiresESignature) {
        AiSuggestion s = new AiSuggestion();
        s.setType(type);
        s.setSourceModule(sourceModule);
        s.setSourceRecordId(sourceRecordId);
        s.setSourceRecordNumber(sourceRecordNumber);
        s.setSuggestion(suggestion);
        s.setConfidence(confidence);
        s.setReasoning(reasoning);
        s.setStatus(AiSuggestionStatus.PENDING);
        s.setAgentType(agentType);
        s.setExecution(execution);
        s.setAssignedTo(assignedTo);
        s.setCreatedBy(createdBy);
        s.setRequiresESignature(requiresESignature);
        // Auto-expire after 7 days
        s.setAutoExpireAt(Instant.now().plusSeconds(7 * 24 * 3600));
        return suggestionRepository.save(s);
    }

    @Transactional(readOnly = true)
    public Page<AiSuggestionResponse> getPendingSuggestions(UUID assignedToId, Pageable pageable) {
        Page<AiSuggestion> suggestions;
        if (assignedToId != null) {
            suggestions = suggestionRepository.findByAssignedToIdAndStatusOrderByCreatedAtDesc(
                    assignedToId, AiSuggestionStatus.PENDING, pageable);
        } else {
            suggestions = suggestionRepository.findByStatusOrderByCreatedAtDesc(
                    AiSuggestionStatus.PENDING, pageable);
        }
        return suggestions.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AiSuggestionResponse> getSuggestionsByRecord(String sourceModule, UUID sourceRecordId,
                                                              Pageable pageable) {
        return suggestionRepository.findBySourceModuleAndSourceRecordIdOrderByCreatedAtDesc(
                sourceModule, sourceRecordId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AiSuggestionResponse getSuggestion(UUID id) {
        return toResponse(findById(id));
    }

    @Transactional
    public AiSuggestionResponse reviewSuggestion(UUID id, AiSuggestionReviewRequest request, User reviewer) {
        AiSuggestion suggestion = findById(id);

        if (suggestion.getStatus() != AiSuggestionStatus.PENDING) {
            throw new BusinessRuleException("Suggestion is no longer pending (current status: " + suggestion.getStatus() + ")", "AI_SUGGESTION_NOT_PENDING");
        }

        AiSuggestionStatus decision = AiSuggestionStatus.valueOf(request.getDecision().toUpperCase());
        if (decision != AiSuggestionStatus.ACCEPTED && decision != AiSuggestionStatus.REJECTED
                && decision != AiSuggestionStatus.MODIFIED) {
            throw new BusinessRuleException("Invalid decision. Must be ACCEPTED, REJECTED, or MODIFIED", "AI_INVALID_DECISION");
        }

        // Handle e-signature if required
        if (Boolean.TRUE.equals(suggestion.getRequiresESignature())) {
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                throw new BusinessRuleException("Electronic signature (password) is required for this decision", "AI_ESIG_REQUIRED");
            }
            VerifyESignatureRequest esigRequest = new VerifyESignatureRequest();
            esigRequest.setPassword(request.getPassword());
            esigRequest.setRecordType("AI_SUGGESTION");
            esigRequest.setRecordId(suggestion.getId());
            esigRequest.setAction(decision.name() + "_AI_SUGGESTION");
            String meaning = request.getSignatureReason() != null
                    ? request.getSignatureReason()
                    : decision.name() + " AI suggestion: " + suggestion.getType();
            esigRequest.setMeaning(meaning);
            ElectronicSignature esig = eSignatureService.verify(esigRequest);
            suggestion.setESignature(esig);
        }

        suggestion.setStatus(decision);
        suggestion.setReviewedBy(reviewer);
        suggestion.setReviewedAt(Instant.now());
        suggestion.setReviewComments(request.getComments());

        if (decision == AiSuggestionStatus.MODIFIED && request.getModification() != null) {
            suggestion.setHumanModification(request.getModification());
        }

        suggestionRepository.save(suggestion);

        // Log to AI audit trail
        AiAuditLog auditLog = new AiAuditLog();
        auditLog.setUser(reviewer);
        auditLog.setAgentType(suggestion.getAgentType());
        auditLog.setAction("SUGGESTION_" + decision.name());
        auditLog.setRecordType(suggestion.getSourceModule());
        auditLog.setRecordId(suggestion.getSourceRecordId());
        auditLog.setRecordNumber(suggestion.getSourceRecordNumber());
        auditLog.setDescription("AI suggestion " + decision.name().toLowerCase()
                + ": " + suggestion.getType()
                + (request.getComments() != null ? " - " + request.getComments() : ""));
        auditLog.setConfidence(suggestion.getConfidence());
        auditLog.setHumanApproved(decision == AiSuggestionStatus.ACCEPTED || decision == AiSuggestionStatus.MODIFIED);
        auditLog.setApprovedByUser(reviewer);
        auditLog.setApprovedAt(Instant.now());
        auditLogRepository.save(auditLog);

        log.info("AI suggestion {} {} by user {}: {}", suggestion.getId(), decision, reviewer.getId(), suggestion.getType());

        return toResponse(suggestion);
    }

    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void expireStaleSuggestions() {
        int expired = suggestionRepository.expirePendingSuggestions(Instant.now());
        if (expired > 0) {
            log.info("Expired {} stale AI suggestions", expired);
        }
    }

    private AiSuggestion findById(UUID id) {
        return suggestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AI suggestion not found: " + id));
    }

    private AiSuggestionResponse toResponse(AiSuggestion s) {
        return AiSuggestionResponse.builder()
                .id(s.getId())
                .type(s.getType())
                .sourceModule(s.getSourceModule())
                .sourceRecordId(s.getSourceRecordId())
                .sourceRecordNumber(s.getSourceRecordNumber())
                .targetModule(s.getTargetModule())
                .targetRecordId(s.getTargetRecordId())
                .suggestion(s.getSuggestion())
                .confidence(s.getConfidence())
                .reasoning(s.getReasoning())
                .status(s.getStatus().name())
                .agentType(s.getAgentType().name())
                .assignedToId(s.getAssignedTo() != null ? s.getAssignedTo().getId() : null)
                .assignedToName(s.getAssignedTo() != null ? s.getAssignedTo().getDisplayName() : null)
                .reviewedByName(s.getReviewedBy() != null ? s.getReviewedBy().getDisplayName() : null)
                .reviewedAt(s.getReviewedAt())
                .reviewComments(s.getReviewComments())
                .humanModification(s.getHumanModification())
                .requiresESignature(Boolean.TRUE.equals(s.getRequiresESignature()))
                .autoExpireAt(s.getAutoExpireAt())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
