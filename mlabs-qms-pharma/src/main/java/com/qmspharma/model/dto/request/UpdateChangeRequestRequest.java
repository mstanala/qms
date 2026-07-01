package com.qmspharma.model.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateChangeRequestRequest {
    private String title;
    private String description;
    private String justification;
    private String type;
    private String category;
    private String classification;
    private String priority;
    private UUID changeOwnerId;
    private Instant targetImplementationDate;
    private List<String> affectedAreas;
    private Boolean validationRequired;
    private Boolean trainingRequired;
}
