package com.qmspharma.model.dto.request;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class SubmitRegulatoryFilingRequest {
    private Boolean filingRequired;
    private String filingType;
    private List<String> markets;
    private String filingDetails;
    private Instant targetFilingDate;
}
