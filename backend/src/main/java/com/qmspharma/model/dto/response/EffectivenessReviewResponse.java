package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class EffectivenessReviewResponse {
    private UUID id;
    private Instant reviewDate;
    private UserRef reviewer;
    private Boolean overallEffective;
    private String summary;
    private Boolean followUpRequired;
    private String followUpActions;
    private List<CriteriaResponse> criteria;

    @Data @Builder
    public static class CriteriaResponse {
        private UUID id;
        private String criterion;
        private Boolean met;
        private String evidence;
    }
}
