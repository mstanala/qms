package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class SubmitEffectivenessReviewRequest {
    @NotNull private Instant reviewDate;
    @NotNull private Boolean overallEffective;
    @NotBlank private String summary;
    private Boolean followUpRequired;
    private String followUpActions;
    private List<CriteriaRequest> criteria;

    @Data
    public static class CriteriaRequest {
        private String criterion;
        private Boolean met;
        private String evidence;
    }
}
