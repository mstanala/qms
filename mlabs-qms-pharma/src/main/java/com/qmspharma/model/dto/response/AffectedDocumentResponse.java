package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AffectedDocumentResponse {
    private UUID id;
    private String documentNumber;
    private String documentTitle;
    private String documentType;
    private String currentVersion;
    private String action;
    private String newVersion;
    private String status;
}
