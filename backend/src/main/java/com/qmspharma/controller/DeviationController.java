package com.qmspharma.controller;

import com.qmspharma.model.dto.request.*;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.service.DeviationService;
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
@RequestMapping("/api/v1/deviations")
@RequiredArgsConstructor
public class DeviationController {

    private final DeviationService deviationService;

    @GetMapping
    public ResponseEntity<Page<DeviationResponse>> list(
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> classification,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID plantSiteId,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(deviationService.list(status, classification, category, type, departmentId, plantSiteId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeviationResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(deviationService.getById(id));
    }

    @PostMapping
    public ResponseEntity<DeviationResponse> create(@Valid @RequestBody CreateDeviationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deviationService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeviationResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateDeviationRequest request) {
        return ResponseEntity.ok(deviationService.update(id, request));
    }

    @PatchMapping("/{id}/classify")
    public ResponseEntity<DeviationResponse> classify(@PathVariable UUID id, @Valid @RequestBody ClassifyDeviationRequest request) {
        return ResponseEntity.ok(deviationService.classify(id, request));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<DeviationResponse> assign(@PathVariable UUID id, @Valid @RequestBody AssignInvestigatorRequest request) {
        return ResponseEntity.ok(deviationService.assign(id, request));
    }

    @PostMapping("/{id}/investigation")
    public ResponseEntity<DeviationResponse> submitInvestigation(@PathVariable UUID id, @Valid @RequestBody SubmitInvestigationRequest request) {
        return ResponseEntity.ok(deviationService.submitInvestigation(id, request));
    }

    @PutMapping("/{id}/investigation")
    public ResponseEntity<DeviationResponse> updateInvestigation(@PathVariable UUID id, @Valid @RequestBody SubmitInvestigationRequest request) {
        return ResponseEntity.ok(deviationService.submitInvestigation(id, request));
    }

    @PostMapping("/{id}/impact-assessment")
    public ResponseEntity<DeviationResponse> submitImpactAssessment(@PathVariable UUID id, @Valid @RequestBody SubmitImpactAssessmentRequest request) {
        return ResponseEntity.ok(deviationService.submitImpactAssessment(id, request));
    }

    @PostMapping("/{id}/disposition")
    public ResponseEntity<DeviationResponse> submitDisposition(@PathVariable UUID id, @Valid @RequestBody SubmitDispositionRequest request) {
        return ResponseEntity.ok(deviationService.submitDisposition(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DeviationResponse> transitionStatus(@PathVariable UUID id, @Valid @RequestBody StatusTransitionRequest request) {
        return ResponseEntity.ok(deviationService.transitionStatus(id, request));
    }

    @GetMapping("/{id}/audit-trail")
    public ResponseEntity<List<AuditTrailResponse>> getAuditTrail(@PathVariable UUID id) {
        return ResponseEntity.ok(deviationService.getAuditTrail(id));
    }

    @GetMapping("/{id}/workflow-history")
    public ResponseEntity<List<WorkflowHistoryResponse>> getWorkflowHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(deviationService.getWorkflowHistory(id));
    }
}
