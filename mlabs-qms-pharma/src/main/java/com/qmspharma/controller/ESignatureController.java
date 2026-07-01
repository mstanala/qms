package com.qmspharma.controller;

import com.qmspharma.model.dto.request.VerifyESignatureRequest;
import com.qmspharma.model.entity.ElectronicSignature;
import com.qmspharma.service.ESignatureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/esignature")
@RequiredArgsConstructor
public class ESignatureController {

    private final ESignatureService eSignatureService;

    @PostMapping("/verify")
    public ResponseEntity<ElectronicSignature> verify(@Valid @RequestBody VerifyESignatureRequest request) {
        return ResponseEntity.ok(eSignatureService.verify(request));
    }
}
