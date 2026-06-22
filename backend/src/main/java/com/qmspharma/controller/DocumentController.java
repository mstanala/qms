package com.qmspharma.controller;

import com.qmspharma.model.dto.request.*;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.service.DocumentService;
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
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<Page<DocumentResponse>> list(
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> documentType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(documentService.list(status, documentType, category, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.getById(id));
    }

    @PostMapping
    public ResponseEntity<DocumentResponse> create(@Valid @RequestBody CreateDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateDocumentRequest request) {
        return ResponseEntity.ok(documentService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DocumentResponse> transitionStatus(@PathVariable UUID id, @Valid @RequestBody DocumentStatusRequest request) {
        return ResponseEntity.ok(documentService.transitionStatus(id, request));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DocumentDashboardResponse> dashboard() {
        return ResponseEntity.ok(documentService.getDashboard());
    }
}