package com.qmspharma.controller;

import com.qmspharma.model.dto.response.AuditTrailResponse;
import com.qmspharma.service.AuditTrailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-trail")
@RequiredArgsConstructor
public class AuditTrailController {

    private final AuditTrailService auditTrailService;

    @GetMapping
    public ResponseEntity<Page<AuditTrailResponse>> search(@RequestParam String recordType,
                                                            @RequestParam UUID recordId,
                                                            Pageable pageable) {
        return ResponseEntity.ok(auditTrailService.search(recordType, recordId, pageable));
    }

    @GetMapping("/record/{recordType}/{recordId}")
    public ResponseEntity<List<AuditTrailResponse>> getByRecord(@PathVariable String recordType, @PathVariable UUID recordId) {
        return ResponseEntity.ok(auditTrailService.getByRecord(recordType, recordId));
    }
}
