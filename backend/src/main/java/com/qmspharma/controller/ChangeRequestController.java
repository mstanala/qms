package com.qmspharma.controller;

import com.qmspharma.model.dto.request.*;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.service.ChangeRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/change-requests")
@RequiredArgsConstructor
public class ChangeRequestController {

    private final ChangeRequestService changeRequestService;

    @GetMapping
    public ResponseEntity<Page<ChangeRequestResponse>> list(
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> classification,
            @RequestParam(required = false) List<String> type,
            @RequestParam(required = false) List<String> priority,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID plantSiteId,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(changeRequestService.list(status, classification, type, priority, departmentId, plantSiteId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChangeRequestResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(changeRequestService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ChangeRequestResponse> create(@Valid @RequestBody CreateChangeRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(changeRequestService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChangeRequestResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateChangeRequestRequest request) {
        return ResponseEntity.ok(changeRequestService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ChangeRequestResponse> transitionStatus(@PathVariable UUID id, @Valid @RequestBody StatusTransitionRequest request) {
        return ResponseEntity.ok(changeRequestService.transitionStatus(id, request));
    }

    @PostMapping("/{id}/impact-assessment")
    public ResponseEntity<Void> submitImpactAssessment(@PathVariable UUID id, @Valid @RequestBody SubmitChangeImpactRequest request) {
        changeRequestService.submitImpactAssessment(id, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/impact-assessment")
    public ResponseEntity<Void> updateImpactAssessment(@PathVariable UUID id, @Valid @RequestBody SubmitChangeImpactRequest request) {
        changeRequestService.submitImpactAssessment(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/affected-documents")
    public ResponseEntity<Void> addAffectedDocument(@PathVariable UUID id, @Valid @RequestBody AddAffectedDocumentRequest request) {
        changeRequestService.addAffectedDocument(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{id}/affected-products")
    public ResponseEntity<Void> addAffectedProduct(@PathVariable UUID id, @Valid @RequestBody AddAffectedProductRequest request) {
        changeRequestService.addAffectedProduct(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{id}/implementation-tasks")
    public ResponseEntity<Void> addImplementationTask(@PathVariable UUID id, @Valid @RequestBody AddImplementationTaskRequest request) {
        changeRequestService.addImplementationTask(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}/implementation-tasks/{taskId}")
    public ResponseEntity<Void> updateImplementationTask(@PathVariable UUID id, @PathVariable UUID taskId, @Valid @RequestBody UpdateImplementationTaskRequest request) {
        changeRequestService.updateImplementationTask(id, taskId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/training-requirements")
    public ResponseEntity<Void> addTrainingRequirement(@PathVariable UUID id, @Valid @RequestBody AddTrainingRequirementRequest request) {
        changeRequestService.addTrainingRequirement(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/{id}/approvals")
    public ResponseEntity<Void> addApprover(@PathVariable UUID id, @Valid @RequestBody AddApproverRequest request) {
        changeRequestService.addApprover(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/{id}/approvals/{approvalId}")
    public ResponseEntity<Void> submitApprovalDecision(@PathVariable UUID id, @PathVariable UUID approvalId, @Valid @RequestBody SubmitApprovalDecisionRequest request) {
        changeRequestService.submitApprovalDecision(id, approvalId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/effectiveness-review")
    public ResponseEntity<Void> submitEffectivenessReview(@PathVariable UUID id, @Valid @RequestBody SubmitEffectivenessReviewRequest request) {
        changeRequestService.submitEffectivenessReview(id, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/audit-trail")
    public ResponseEntity<List<AuditTrailResponse>> getAuditTrail(@PathVariable UUID id) {
        return ResponseEntity.ok(changeRequestService.getAuditTrail(id));
    }
}
