package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClassifyDeviationRequest {
    @NotNull private String classification;
    private String comments;
}
