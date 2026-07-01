package com.qmspharma.controller;

import com.qmspharma.model.dto.response.ComplaintResponse;
import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.service.ComplaintService;
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
@RequestMapping("/api/v1/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<Page<ComplaintResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String complaintType,
            @RequestParam(required = false) String classification,
            @RequestParam(required = false) UUID plantSiteId,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(complaintService.list(status, complaintType, classification, plantSiteId, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(complaintService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> create(@RequestBody Map<String, Object> request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(complaintService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComplaintResponse> update(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(complaintService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> transitionStatus(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        String status = (String) request.get("status");
        return ResponseEntity.ok(complaintService.transitionStatus(id, status, request));
    }

    @GetMapping("/{id}/workflow-history")
    public ResponseEntity<List<WorkflowHistoryResponse>> getWorkflowHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(complaintService.getWorkflowHistory(id));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(complaintService.getDashboardMetrics());
    }
}
