package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TrainingDashboardResponse {
    private long totalCurricula;
    private long activeCurricula;
    private long totalAssignments;
    private long completedAssignments;
    private long overdueAssignments;
    private double complianceRate;
    private long upcomingSessions;
    private List<CategoryCount> byCategory;
    private List<StatusCount> byStatus;

    @Data @Builder
    public static class CategoryCount { private String category; private long count; }
    @Data @Builder
    public static class StatusCount { private String status; private long count; }
}