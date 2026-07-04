package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SubmitRcaRequest {
    @NotNull private String method;
    @NotBlank private String description;
    private List<String> rootCauses;
    private List<String> contributingFactors;
    private List<FiveWhyEntryRequest> fiveWhyEntries;
    private List<FishboneCategoryRequest> fishboneCategories;

    @Data
    public static class FiveWhyEntryRequest {
        private Integer level;
        private String question;
        private String answer;
    }

    @Data
    public static class FishboneCategoryRequest {
        private String categoryName;
        private List<String> causes;
    }
}
