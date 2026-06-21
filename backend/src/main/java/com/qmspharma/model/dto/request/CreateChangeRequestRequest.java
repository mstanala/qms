package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class CreateChangeRequestRequest {
    @NotBlank private String title;
    @NotBlank private String description;
    @NotBlank private String justification;
    @NotNull private String type;
    @NotNull private String category;
    @NotNull private String classification;
    @NotNull private String priority;
    @NotNull private UUID departmentId;
    @NotNull private UUID changeOwnerId;
    @NotNull private UUID plantSiteId;
    @NotNull private Instant targetImplementationDate;
    private List<String> affectedAreas;
    private Boolean validationRequired;
    private Boolean trainingRequired;
    private List<String> relatedDeviations;
    private List<String> relatedCapas;
}
