package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DocumentVersionResponse {
    private UUID id;
    private String versionNumber;
    private Integer majorVersion;
    private Integer minorVersion;
    private String changeDescription;
    private String changeType;
    private String status;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private UserRef author;
    private UserRef reviewer;
    private UserRef approver;
    private Instant approvedDate;
    private Instant effectiveDate;
    private Instant supersededDate;
    private Instant createdAt;
}