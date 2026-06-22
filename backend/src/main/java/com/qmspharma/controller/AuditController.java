package com.qmspharma.controller;

import com.qmspharma.model.entity.Audit;
import com.qmspharma.model.entity.AuditFinding;
import com.qmspharma.model.entity.AuditPlan;
import com.qmspharma.service.AuditService;
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
@RequestMapping("/api/v1/audits")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    // ─── Audit Plans ─────────────────────────────────────────────────────────────

    @GetMapping("/plans")
    public ResponseEntity<Page<AuditPlan>> listPlans(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer planYear,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(auditService.listPlans(status, planYear, pageable));
    }

    @PostMapping("/plans")
    public ResponseEntity<AuditPlan> createPlan(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditService.createPlan(request));
    }

    @GetMapping("/plans/{id}")
    public ResponseEntity<AuditPlan> getPlan(@PathVariable UUID id) {
        return ResponseEntity.ok(auditService.getPlanById(id));
    }

    // ─── Audits ──────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<Audit>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String auditType,
            @RequestParam(required = false) UUID plantSiteId,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(auditService.listAudits(status, auditType, plantSiteId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Audit> get(@PathVariable UUID id) {
        return ResponseEntity.ok(auditService.getAuditById(id));
    }

    @PostMapping
    public ResponseEntity<Audit> create(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditService.createAudit(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Audit> update(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(auditService.updateAudit(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Audit> transitionStatus(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(auditService.transitionStatus(id, request.get("status")));
    }

    // ─── Findings ────────────────────────────────────────────────────────────────

    @GetMapping("/{auditId}/findings")
    public ResponseEntity<List<AuditFinding>> listFindings(@PathVariable UUID auditId) {
        return ResponseEntity.ok(auditService.listFindings(auditId));
    }

    @PostMapping("/{auditId}/findings")
    public ResponseEntity<AuditFinding> createFinding(@PathVariable UUID auditId, @RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditService.createFinding(auditId, request));
    }

    @PutMapping("/findings/{id}")
    public ResponseEntity<AuditFinding> updateFinding(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(auditService.updateFinding(id, request));
    }

    // ─── Dashboard ───────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(auditService.getDashboardMetrics());
    }
}
