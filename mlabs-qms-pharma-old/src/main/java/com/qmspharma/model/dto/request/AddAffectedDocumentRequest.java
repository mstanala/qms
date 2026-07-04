package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddAffectedDocumentRequest {
    @NotBlank private String documentNumber;
    @NotBlank private String documentTitle;
    private String documentType;
    private String currentVersion;
    @NotNull private String action;
    private String newVersion;
}
