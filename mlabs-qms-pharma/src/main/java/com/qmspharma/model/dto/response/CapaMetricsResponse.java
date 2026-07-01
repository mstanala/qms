package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class CapaMetricsResponse {
    private long totalCapas;
    private long openCapas;
    private long overdueCapas;
    private long closedCapas;
    private Map<String, Long> byStatus;
    private Map<String, Long> byPriority;
    private Map<String, Long> byDepartment;
}
