package com.qmspharma.controller;

import com.qmspharma.model.dto.response.LookupValueResponse;
import com.qmspharma.model.entity.Batch;
import com.qmspharma.model.entity.Product;
import com.qmspharma.repository.BatchRepository;
import com.qmspharma.repository.ProductRepository;
import com.qmspharma.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LookupController {

    private final LookupService lookupService;
    private final ProductRepository productRepository;
    private final BatchRepository batchRepository;

    @GetMapping("/lookups")
    public ResponseEntity<List<LookupValueResponse>> getLookups(@RequestParam String category) {
        return ResponseEntity.ok(lookupService.getByCategory(category));
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> listProducts() {
        return ResponseEntity.ok(productRepository.findByIsActiveTrue());
    }

    @GetMapping("/batches")
    public ResponseEntity<List<Batch>> listBatches(@RequestParam UUID productId) {
        return ResponseEntity.ok(batchRepository.findByProductId(productId));
    }
}
