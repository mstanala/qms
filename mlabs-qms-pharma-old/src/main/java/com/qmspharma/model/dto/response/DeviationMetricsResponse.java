package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DeviationMetricsResponse {
    private long totalDeviations;
    private long openDeviations;
    private long overdueDeviations;
    private long closedDeviations;
    private Map<String, Long> byStatus;
    private Map<String, Long> byClassification;
    private Map<String, Long> byCategory;
    private Map<String, Long> byDepartment;
}
