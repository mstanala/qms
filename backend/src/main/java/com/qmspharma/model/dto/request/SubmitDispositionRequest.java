package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitDispositionRequest {
    @NotNull private String decision;
    @NotBlank private String justification;
    private String conditions;
    private String qaReviewComments;
    private ESignatureRequest electronicSignature;
}
