package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AttachmentResponse {
    private UUID id;
    private String recordType;
    private UUID recordId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String category;
    private String description;
    private UserRef uploadedBy;
    private Instant uploadedDate;
    private String downloadUrl;
}
