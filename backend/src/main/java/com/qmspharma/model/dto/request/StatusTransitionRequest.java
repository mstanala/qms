package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusTransitionRequest {
    @NotNull private String status;
    private String comments;
    private ESignatureRequest electronicSignature;
}
