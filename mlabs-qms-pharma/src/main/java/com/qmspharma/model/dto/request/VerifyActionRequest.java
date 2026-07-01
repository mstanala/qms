package com.qmspharma.model.dto.request;

import lombok.Data;

@Data
public class VerifyActionRequest {
    private String verificationComments;
    private ESignatureRequest electronicSignature;
}
