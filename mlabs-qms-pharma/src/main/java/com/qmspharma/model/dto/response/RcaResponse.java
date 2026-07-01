package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RcaResponse {
    private UUID id;
    private String method;
    private String description;
    private List<String> rootCauses;
    private List<String> contributingFactors;
    private List<FiveWhyEntryResponse> fiveWhyEntries;
    private List<FishboneCategoryResponse> fishboneCategories;
    private Instant completedDate;
    private UserRef completedBy;

    @Data @Builder
    public static class FiveWhyEntryResponse {
        private Integer level;
        private String question;
        private String answer;
    }

    @Data @Builder
    public static class FishboneCategoryResponse {
        private String categoryName;
        private List<String> causes;
    }
}
