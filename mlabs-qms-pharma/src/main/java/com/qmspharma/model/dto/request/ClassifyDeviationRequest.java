package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ClassifyDeviationRequest {
    @NotNull private String classification;
    private UUID assignedToId;
    private String comments;
}
