package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RiskAssessmentResponse {
    private UUID id;
    private Integer severity;
    private Integer occurrence;
    private Integer detection;
    private Integer rpn;
    private String riskLevel;
    private String justification;
    private UserRef assessedBy;
    private Instant assessedDate;
}
