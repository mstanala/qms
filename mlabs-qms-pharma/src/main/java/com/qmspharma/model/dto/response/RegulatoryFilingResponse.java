package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RegulatoryFilingResponse {
    private UUID id;
    private Boolean filingRequired;
    private String filingType;
    private List<String> markets;
    private String filingDetails;
    private Instant targetFilingDate;
    private String filingStatus;
}
