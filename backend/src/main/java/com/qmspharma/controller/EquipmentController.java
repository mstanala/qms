package com.qmspharma.controller;

import com.qmspharma.model.entity.CalibrationRecord;
import com.qmspharma.model.entity.Equipment;
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
    public ResponseEntity<Page<Equipment>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String equipmentType,
            @RequestParam(required = false) UUID plantSiteId,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(equipmentService.list(status, equipmentType, plantSiteId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipment> get(@PathVariable UUID id) {
        return ResponseEntity.ok(equipmentService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Equipment> create(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Equipment> update(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(equipmentService.update(id, request));
    }

    @GetMapping("/{equipmentId}/calibrations")
    public ResponseEntity<List<CalibrationRecord>> listCalibrations(@PathVariable UUID equipmentId) {
        return ResponseEntity.ok(equipmentService.listCalibrations(equipmentId));
    }

    @PostMapping("/{equipmentId}/calibrations")
    public ResponseEntity<CalibrationRecord> createCalibration(@PathVariable UUID equipmentId, @RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.createCalibration(equipmentId, request));
    }

    @PutMapping("/calibrations/{id}")
    public ResponseEntity<CalibrationRecord> updateCalibration(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(equipmentService.updateCalibration(id, request));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(equipmentService.getDashboardMetrics());
    }
}
