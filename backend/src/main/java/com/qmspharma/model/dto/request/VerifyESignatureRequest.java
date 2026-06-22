package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class VerifyESignatureRequest {
    @NotBlank private String password;
    @NotBlank private String meaning;
    @NotBlank private String recordType;
    @NotNull private UUID recordId;
    @NotBlank private String action;
}
