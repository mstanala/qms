package com.qmspharma.controller;

import com.qmspharma.model.dto.response.CalibrationRecordResponse;
import com.qmspharma.model.dto.response.EquipmentResponse;
import com.qmspharma.model.dto.response.MaintenanceRecordResponse;
import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.service.EquipmentService;
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
@RequestMapping("/api/v1/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    // =========================================================================
    // Equipment CRUD
    // =========================================================================

    @GetMapping
    public ResponseEntity<Page<EquipmentResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String equipmentType,
            @RequestParam(required = false) UUID plantSiteId,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(equipmentService.list(status, equipmentType, plantSiteId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(equipmentService.getById(id));
    }

    @PostMapping
    public ResponseEntity<EquipmentResponse> create(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipmentResponse> update(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(equipmentService.update(id, request));
    }

    // =========================================================================
    // Step 2: Qualification (IQ/OQ/PQ)
    // =========================================================================

    @PostMapping("/{id}/qualify/{phase}")
    public ResponseEntity<EquipmentResponse> completeQualificationPhase(
            @PathVariable UUID id, @PathVariable String phase) {
        return ResponseEntity.ok(equipmentService.completeQualificationPhase(id, phase));
    }

    // =========================================================================
    // Step 3 & 4: Calibration
    // =========================================================================

    @GetMapping("/{equipmentId}/calibrations")
    public ResponseEntity<List<CalibrationRecordResponse>> listCalibrations(@PathVariable UUID equipmentId) {
        return ResponseEntity.ok(equipmentService.listCalibrations(equipmentId));
    }

    @PostMapping("/{equipmentId}/calibrations")
    public ResponseEntity<CalibrationRecordResponse> createCalibration(
            @PathVariable UUID equipmentId, @RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.createCalibration(equipmentId, request));
    }

    @PutMapping("/calibrations/{id}")
    public ResponseEntity<CalibrationRecordResponse> updateCalibration(
            @PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(equipmentService.updateCalibration(id, request));
    }

    @PostMapping("/calibrations/{id}/review")
    public ResponseEntity<CalibrationRecordResponse> reviewCalibration(
            @PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(equipmentService.reviewCalibration(id, request));
    }

    // =========================================================================
    // Step 5: Maintenance
    // =========================================================================

    @GetMapping("/{equipmentId}/maintenance")
    public ResponseEntity<List<MaintenanceRecordResponse>> listMaintenance(@PathVariable UUID equipmentId) {
        return ResponseEntity.ok(equipmentService.listMaintenance(equipmentId));
    }

    @PostMapping("/{equipmentId}/maintenance")
    public ResponseEntity<MaintenanceRecordResponse> createMaintenance(
            @PathVariable UUID equipmentId, @RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.createMaintenance(equipmentId, request));
    }

    @PostMapping("/maintenance/{id}/complete")
    public ResponseEntity<MaintenanceRecordResponse> completeMaintenance(
            @PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(equipmentService.completeMaintenance(id, request));
    }

    @PostMapping("/maintenance/{id}/report-breakdown")
    public ResponseEntity<MaintenanceRecordResponse> reportBreakdown(@PathVariable UUID id) {
        return ResponseEntity.ok(equipmentService.reportBreakdown(id));
    }

    // =========================================================================
    // Step 6: Re-qualification
    // =========================================================================

    @PostMapping("/{id}/requalification/start")
    public ResponseEntity<EquipmentResponse> startRequalification(@PathVariable UUID id) {
        return ResponseEntity.ok(equipmentService.startRequalification(id));
    }

    @PostMapping("/{id}/requalification/complete")
    public ResponseEntity<EquipmentResponse> completeRequalification(@PathVariable UUID id) {
        return ResponseEntity.ok(equipmentService.completeRequalification(id));
    }

    // =========================================================================
    // Step 7: Decommission
    // =========================================================================

    @PostMapping("/{id}/decommission")
    public ResponseEntity<EquipmentResponse> decommission(
            @PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(equipmentService.decommission(id, request));
    }

    // =========================================================================
    // Workflow History & Dashboard
    // =========================================================================

    @GetMapping("/{id}/workflow-history")
    public ResponseEntity<List<WorkflowHistoryResponse>> getWorkflowHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(equipmentService.getWorkflowHistory(id));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(equipmentService.getDashboardMetrics());
    }
}
