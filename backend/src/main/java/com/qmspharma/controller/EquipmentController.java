package com.qmspharma.controller;

import com.qmspharma.model.dto.response.CalibrationRecordResponse;
import com.qmspharma.model.dto.response.EquipmentResponse;
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

    @GetMapping("/{equipmentId}/calibrations")
    public ResponseEntity<List<CalibrationRecordResponse>> listCalibrations(@PathVariable UUID equipmentId) {
        return ResponseEntity.ok(equipmentService.listCalibrations(equipmentId));
    }

    @PostMapping("/{equipmentId}/calibrations")
    public ResponseEntity<CalibrationRecordResponse> createCalibration(@PathVariable UUID equipmentId, @RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.createCalibration(equipmentId, request));
    }

    @PutMapping("/calibrations/{id}")
    public ResponseEntity<CalibrationRecordResponse> updateCalibration(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(equipmentService.updateCalibration(id, request));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(equipmentService.getDashboardMetrics());
    }
}
