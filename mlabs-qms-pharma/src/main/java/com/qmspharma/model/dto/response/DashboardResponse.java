package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardResponse {
    private long openCapas;
    private long openDeviations;
    private long openChangeRequests;
    private long overdueCapas;
    private long overdueDeviations;
    private long overdueChangeRequests;
    private long pendingReviews;
    private Map<String, Long> capasByStatus;
    private Map<String, Long> deviationsByStatus;
    private Map<String, Long> changeRequestsByStatus;
}
