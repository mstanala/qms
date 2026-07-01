package com.qmspharma.controller;

import com.qmspharma.model.dto.response.*;
import com.qmspharma.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<DashboardResponse> overview() {
        return ResponseEntity.ok(dashboardService.getOverview());
    }

    @GetMapping("/capa-metrics")
    public ResponseEntity<CapaMetricsResponse> capaMetrics() {
        return ResponseEntity.ok(dashboardService.getCapaMetrics());
    }

    @GetMapping("/deviation-metrics")
    public ResponseEntity<DeviationMetricsResponse> deviationMetrics() {
        return ResponseEntity.ok(dashboardService.getDeviationMetrics());
    }

    @GetMapping("/change-control-metrics")
    public ResponseEntity<ChangeControlMetricsResponse> changeControlMetrics() {
        return ResponseEntity.ok(dashboardService.getChangeControlMetrics());
    }
}
