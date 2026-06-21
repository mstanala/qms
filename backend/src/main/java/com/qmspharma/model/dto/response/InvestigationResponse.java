package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class InvestigationResponse {
    private UUID id;
    private UserRef investigator;
    private Instant startDate;
    private Instant completedDate;
    private String probableCause;
    private String rootCause;
    private String findings;
    private String conclusion;
    private String method;
    private List<String> immediateActions;
}
