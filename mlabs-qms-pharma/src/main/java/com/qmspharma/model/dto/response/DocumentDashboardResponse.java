package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DocumentDashboardResponse {
    private long totalDocuments;
    private long effectiveDocuments;
    private long draftDocuments;
    private long pendingReview;
    private long pendingApproval;
    private long overdueReviews;
    private long expiringNext30Days;
    private List<TypeCount> byType;
    private List<StatusCount> byStatus;

    @Data @Builder
    public static class TypeCount { private String type; private long count; }
    @Data @Builder
    public static class StatusCount { private String status; private long count; }
}