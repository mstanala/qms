package com.qmspharma.controller;

import com.qmspharma.model.dto.request.*;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.service.TrainingService;
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
@RequestMapping("/api/v1/training")
@RequiredArgsConstructor
public class TrainingController {

    private final TrainingService trainingService;

    // ─── Curricula ─────────────────────────────────────────────────

    @GetMapping("/curricula")
    public ResponseEntity<Page<CurriculumResponse>> listCurricula(
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(trainingService.listCurricula(status, category, search, pageable));
    }

    @GetMapping("/curricula/{id}")
    public ResponseEntity<CurriculumResponse> getCurriculum(@PathVariable UUID id) {
        return ResponseEntity.ok(trainingService.getCurriculumById(id));
    }

    @PostMapping("/curricula")
    public ResponseEntity<CurriculumResponse> createCurriculum(@Valid @RequestBody CreateCurriculumRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(trainingService.createCurriculum(request));
    }

    // ─── Assignments ───────────────────────────────────────────────

    @GetMapping("/assignments")
    public ResponseEntity<Page<TrainingAssignmentResponse>> listAssignments(
            @RequestParam(required = false) String status,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(trainingService.listAssignments(status, pageable));
    }

    @GetMapping("/assignments/my")
    public ResponseEntity<Page<TrainingAssignmentResponse>> myAssignments(@ParameterObject Pageable pageable) {
        return ResponseEntity.ok(trainingService.getMyAssignments(pageable));
    }

    @PostMapping("/assignments")
    public ResponseEntity<TrainingAssignmentResponse> createAssignment(@Valid @RequestBody CreateAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(trainingService.createAssignment(request));
    }

    @PatchMapping("/assignments/{id}/complete")
    public ResponseEntity<TrainingAssignmentResponse> completeAssignment(
            @PathVariable UUID id, @RequestBody CompleteAssignmentRequest request) {
        return ResponseEntity.ok(trainingService.completeAssignment(id, request));
    }

    // ─── Matrix ────────────────────────────────────────────────────

    @GetMapping("/matrix")
    public ResponseEntity<List<TrainingMatrixResponse>> getMatrix(
            @RequestParam(required = false) UUID departmentId) {
        return ResponseEntity.ok(trainingService.getMatrix(departmentId));
    }

    // ─── Sessions ──────────────────────────────────────────────────

    @GetMapping("/sessions")
    public ResponseEntity<Page<TrainingSessionResponse>> listSessions(@ParameterObject Pageable pageable) {
        return ResponseEntity.ok(trainingService.listSessions(pageable));
    }

    // ─── Dashboard ─────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<TrainingDashboardResponse> dashboard() {
        return ResponseEntity.ok(trainingService.getDashboard());
    }
}