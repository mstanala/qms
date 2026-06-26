package com.qmspharma.controller;

import com.qmspharma.model.dto.response.AttachmentResponse;
import com.qmspharma.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping
    public ResponseEntity<AttachmentResponse> upload(@RequestParam("file") MultipartFile file,
                                                      @RequestParam String recordType,
                                                      @RequestParam UUID recordId,
                                                      @RequestParam(required = false) String category,
                                                      @RequestParam(required = false) String description) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attachmentService.upload(file, recordType, recordId, category, description));
    }

    @GetMapping
    public ResponseEntity<List<AttachmentResponse>> list(@RequestParam String recordType, @RequestParam UUID recordId) {
        return ResponseEntity.ok(attachmentService.listByRecord(recordType, recordId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Map<String, String>> download(@PathVariable UUID id,
                                                        @RequestParam(defaultValue = "false") boolean download) {
        return ResponseEntity.ok(Map.of("url", attachmentService.getDownloadUrl(id, download)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        attachmentService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
