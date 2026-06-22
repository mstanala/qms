package com.qmspharma.controller;

import com.qmspharma.model.dto.request.*;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.service.CapaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/capas")
@RequiredArgsConstructor
public class CapaController {

    private final CapaService capaService;

    @GetMapping
    public ResponseEntity<Page<CapaResponse>> list(
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> priority,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID plantSiteId,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(capaService.list(status, priority, type, sourceType, departmentId, plantSiteId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CapaResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(capaService.getById(id));
    }

    @PostMapping
    public ResponseEntity<CapaResponse> create(@Valid @RequestBody CreateCapaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(capaService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CapaResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateCapaRequest request) {
        return ResponseEntity.ok(capaService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CapaResponse> transitionStatus(@PathVariable UUID id, @Valid @RequestBody StatusTransitionRequest request) {
        return ResponseEntity.ok(capaService.transitionStatus(id, request));
    }

    @PostMapping("/{id}/root-cause-analysis")
    public ResponseEntity<CapaResponse> submitRca(@PathVariable UUID id, @Valid @RequestBody SubmitRcaRequest request) {
        return ResponseEntity.ok(capaService.submitRca(id, request));
    }

    @PutMapping("/{id}/root-cause-analysis")
    public ResponseEntity<CapaResponse> updateRca(@PathVariable UUID id, @Valid @RequestBody SubmitRcaRequest request) {
        return ResponseEntity.ok(capaService.submitRca(id, request));
    }

    @PostMapping("/{id}/risk-assessment")
    public ResponseEntity<CapaResponse> submitRiskAssessment(@PathVariable UUID id, @Valid @RequestBody SubmitRiskAssessmentRequest request) {
        return ResponseEntity.ok(capaService.submitRiskAssessment(id, request));
    }

    @PostMapping("/{id}/actions")
    public ResponseEntity<CapaActionResponse> addAction(@PathVariable UUID id, @Valid @RequestBody CreateCapaActionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(capaService.addAction(id, request));
    }

    @PutMapping("/{id}/actions/{actionId}")
    public ResponseEntity<CapaActionResponse> updateAction(@PathVariable UUID id, @PathVariable UUID actionId, @Valid @RequestBody UpdateCapaActionRequest request) {
        return ResponseEntity.ok(capaService.updateAction(id, actionId, request));
    }

    @PatchMapping("/{id}/actions/{actionId}/complete")
    public ResponseEntity<CapaActionResponse> completeAction(@PathVariable UUID id, @PathVariable UUID actionId, @Valid @RequestBody CompleteActionRequest request) {
        return ResponseEntity.ok(capaService.completeAction(id, actionId, request));
    }

    @PatchMapping("/{id}/actions/{actionId}/verify")
    public ResponseEntity<CapaActionResponse> verifyAction(@PathVariable UUID id, @PathVariable UUID actionId, @Valid @RequestBody VerifyActionRequest request) {
        return ResponseEntity.ok(capaService.verifyAction(id, actionId, request));
    }

    @PostMapping("/{id}/effectiveness-check")
    public ResponseEntity<CapaResponse> submitEffectivenessCheck(@PathVariable UUID id, @Valid @RequestBody SubmitEffectivenessCheckRequest request) {
        return ResponseEntity.ok(capaService.submitEffectivenessCheck(id, request));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<CapaResponse> approve(@PathVariable UUID id, @Valid @RequestBody ApproveRejectRequest request) {
        StatusTransitionRequest str = new StatusTransitionRequest();
        str.setStatus("PENDING_CLOSURE");
        str.setComments(request.getComments());
        return ResponseEntity.ok(capaService.transitionStatus(id, str));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<CapaResponse> reject(@PathVariable UUID id, @Valid @RequestBody ApproveRejectRequest request) {
        StatusTransitionRequest str = new StatusTransitionRequest();
        str.setStatus("REJECTED");
        str.setComments(request.getComments());
        return ResponseEntity.ok(capaService.transitionStatus(id, str));
    }

    @PostMapping("/{id}/start-action-execution")
    public ResponseEntity<CapaResponse> startActionExecution(@PathVariable UUID id) {
        return ResponseEntity.ok(capaService.startActionExecution(id));
    }

    @PostMapping("/{id}/complete-action-execution")
    public ResponseEntity<CapaResponse> completeActionExecution(@PathVariable UUID id) {
        return ResponseEntity.ok(capaService.completeActionExecution(id));
    }

    @GetMapping("/{id}/workflow-history")
    public ResponseEntity<List<WorkflowHistoryResponse>> getWorkflowHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(capaService.getWorkflowHistory(id));
    }

    @GetMapping("/{id}/audit-trail")
    public ResponseEntity<List<AuditTrailResponse>> getAuditTrail(@PathVariable UUID id) {
        return ResponseEntity.ok(capaService.getAuditTrail(id));
    }
}
