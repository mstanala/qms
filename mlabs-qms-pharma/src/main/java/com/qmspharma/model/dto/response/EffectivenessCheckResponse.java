package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EffectivenessCheckResponse {
    private UUID id;
    private String criteria;
    private Instant checkDate;
    private String result;
    private String evidence;
    private UserRef verifiedBy;
    private String comments;
    private Boolean requiresRecurrence;
    private Integer recurrenceMonths;
    private Instant nextCheckDate;
    private Integer checkNumber;
}
