package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserActivityResponse {
    private String id;
    private String type;
    private String action;
    private String description;
    private String recordType;
    private String recordId;
    private String recordNumber;
    private String status;
    private String ipAddress;
    private Instant timestamp;
}
