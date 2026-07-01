package com.qmspharma.controller;

import com.qmspharma.model.dto.request.AdvancedSearchRequest;
import com.qmspharma.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> search(@RequestParam String q, @RequestParam(required = false) String type) {
        return ResponseEntity.ok(searchService.search(q, type));
    }

    @PostMapping("/advanced")
    public ResponseEntity<Map<String, Object>> advancedSearch(@RequestBody AdvancedSearchRequest request) {
        return ResponseEntity.ok(searchService.advancedSearch(request));
    }
}
