package com.qmspharma.controller;

import com.qmspharma.model.dto.request.AdvancedSearchRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    // TODO: Integrate with OpenSearch
    @GetMapping
    public ResponseEntity<Map<String, Object>> search(@RequestParam String q, @RequestParam(required = false) String type) {
        return ResponseEntity.ok(Map.of("results", Collections.emptyList(), "total", 0));
    }

    @PostMapping("/advanced")
    public ResponseEntity<Map<String, Object>> advancedSearch(@RequestBody AdvancedSearchRequest request) {
        return ResponseEntity.ok(Map.of("results", Collections.emptyList(), "total", 0));
    }
}
