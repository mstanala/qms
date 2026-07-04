package com.qmspharma.controller;

import com.qmspharma.model.dto.response.SupplierResponse;
import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<Page<SupplierResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String supplierType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(supplierService.list(status, supplierType, category, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(supplierService.getById(id));
    }

    @PostMapping
    public ResponseEntity<SupplierResponse> create(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> update(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(supplierService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SupplierResponse> transitionStatus(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        String newStatus = (String) request.get("status");
        // Pass the full request map as params so the service can extract documentDecision, auditResult, etc.
        Map<String, Object> params = new HashMap<>(request);
        params.remove("status");
        return ResponseEntity.ok(supplierService.transitionStatus(id, newStatus, params));
    }

    @PutMapping("/{id}/scores")
    public ResponseEntity<SupplierResponse> updateScores(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        BigDecimal qualityScore = toBigDecimal(request.get("qualityScore"));
        BigDecimal deliveryScore = toBigDecimal(request.get("deliveryScore"));
        BigDecimal complianceScore = toBigDecimal(request.get("complianceScore"));
        return ResponseEntity.ok(supplierService.updateScores(id, qualityScore, deliveryScore, complianceScore));
    }

    @PostMapping("/{id}/requalification")
    public ResponseEntity<SupplierResponse> startRequalification(@PathVariable UUID id) {
        return ResponseEntity.ok(supplierService.startRequalification(id));
    }

    @GetMapping("/{id}/workflow-history")
    public ResponseEntity<List<WorkflowHistoryResponse>> getWorkflowHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(supplierService.getWorkflowHistory(id));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(supplierService.getDashboardMetrics());
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        return new BigDecimal(value.toString());
    }
}
