package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ChangeControlMetricsResponse {
    private long totalChangeRequests;
    private long openChangeRequests;
    private long overdueChangeRequests;
    private long closedChangeRequests;
    private Map<String, Long> byStatus;
    private Map<String, Long> byType;
    private Map<String, Long> byClassification;
    private Map<String, Long> byDepartment;
}
