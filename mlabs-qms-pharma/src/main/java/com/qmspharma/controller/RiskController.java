package com.qmspharma.controller;

import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.model.entity.RiskAssessment;
import com.qmspharma.model.entity.RiskControl;
import com.qmspharma.model.entity.RiskRegister;
import com.qmspharma.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/risks")
@RequiredArgsConstructor
public class RiskController {

    private final RiskService riskService;

    // ─── Risk Registers ──────────────────────────────────────────────────────────

    @GetMapping("/registers")
    public ResponseEntity<Page<RiskRegister>> listRegisters(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskType,
            @RequestParam(required = false) String methodology,
            @RequestParam(required = false) UUID plantSiteId,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(riskService.listRegisters(status, riskType, methodology, plantSiteId, search, pageable));
    }

    @GetMapping("/registers/{id}")
    public ResponseEntity<RiskRegister> getRegister(@PathVariable UUID id) {
        return ResponseEntity.ok(riskService.getRegisterById(id));
    }

    @PostMapping("/registers")
    public ResponseEntity<RiskRegister> createRegister(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(riskService.createRegister(request));
    }

    @PutMapping("/registers/{id}")
    public ResponseEntity<RiskRegister> updateRegister(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(riskService.updateRegister(id, request));
    }

    @PatchMapping("/registers/{id}/status")
    public ResponseEntity<RiskRegister> transitionRegisterStatus(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        String newStatus = (String) request.get("status");
        return ResponseEntity.ok(riskService.transitionRegisterStatus(id, newStatus, request));
    }

    // ─── Risk Assessments ────────────────────────────────────────────────────────

    @GetMapping("/registers/{registerId}/assessments")
    public ResponseEntity<List<RiskAssessment>> listAssessments(@PathVariable UUID registerId) {
        return ResponseEntity.ok(riskService.listAssessments(registerId));
    }

    @GetMapping("/assessments")
    public ResponseEntity<Page<RiskAssessment>> listAllAssessments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(riskService.listAllAssessments(status, riskLevel, search, pageable));
    }

    @GetMapping("/assessments/{id}")
    public ResponseEntity<RiskAssessment> getAssessment(@PathVariable UUID id) {
        return ResponseEntity.ok(riskService.getAssessmentById(id));
    }

    @PostMapping("/registers/{registerId}/assessments")
    public ResponseEntity<RiskAssessment> createAssessment(@PathVariable UUID registerId, @RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(riskService.createAssessment(registerId, request));
    }

    @PutMapping("/assessments/{id}")
    public ResponseEntity<RiskAssessment> updateAssessment(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(riskService.updateAssessment(id, request));
    }

    @PatchMapping("/assessments/{id}/residual-risk")
    public ResponseEntity<RiskAssessment> updateResidualRisk(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(riskService.updateResidualRisk(id, request));
    }

    // ─── Risk Controls ───────────────────────────────────────────────────────────

    @GetMapping("/assessments/{assessmentId}/controls")
    public ResponseEntity<List<RiskControl>> listControls(@PathVariable UUID assessmentId) {
        return ResponseEntity.ok(riskService.listControls(assessmentId));
    }

    @PostMapping("/assessments/{assessmentId}/controls")
    public ResponseEntity<RiskControl> addControl(@PathVariable UUID assessmentId, @RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(riskService.addControl(assessmentId, request));
    }

    @PutMapping("/controls/{id}")
    public ResponseEntity<RiskControl> updateControl(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(riskService.updateControl(id, request));
    }

    // ─── Workflow History ─────────────────────────────────────────────────────────

    @GetMapping("/registers/{id}/workflow-history")
    public ResponseEntity<List<WorkflowHistoryResponse>> getWorkflowHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(riskService.getWorkflowHistory(id));
    }

    // ─── Dashboard ───────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(riskService.getDashboardMetrics());
    }
}
