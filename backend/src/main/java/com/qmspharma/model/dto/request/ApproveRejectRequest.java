package com.qmspharma.model.dto.request;

import lombok.Data;

@Data
public class ApproveRejectRequest {
    private String comments;
    private ESignatureRequest electronicSignature;
}
