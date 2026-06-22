package com.qmspharma.controller;

import com.qmspharma.model.dto.response.NonconformanceResponse;
import com.qmspharma.service.NonconformanceService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/nonconformances")
@RequiredArgsConstructor
public class NonconformanceController {

    private final NonconformanceService ncService;

    @GetMapping
    public ResponseEntity<Page<NonconformanceResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String ncType,
            @RequestParam(required = false) String holdStatus,
            @RequestParam(required = false) UUID plantSiteId,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(ncService.list(status, ncType, holdStatus, plantSiteId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NonconformanceResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ncService.getById(id));
    }

    @PostMapping
    public ResponseEntity<NonconformanceResponse> create(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ncService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NonconformanceResponse> update(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ncService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<NonconformanceResponse> transitionStatus(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(ncService.transitionStatus(id, request.get("status")));
    }

    @PatchMapping("/{id}/disposition")
    public ResponseEntity<NonconformanceResponse> submitDisposition(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ncService.submitDisposition(id, request));
    }

    @PatchMapping("/{id}/hold")
    public ResponseEntity<NonconformanceResponse> toggleHold(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ncService.toggleHold(id, request));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(ncService.getDashboardMetrics());
    }
}
