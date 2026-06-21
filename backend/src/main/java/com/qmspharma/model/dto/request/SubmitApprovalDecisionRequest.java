package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitApprovalDecisionRequest {
    @NotNull private String decision;
    private String comments;
    private ESignatureRequest electronicSignature;
}
