package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SubmitInvestigationRequest {
    @NotNull private UUID investigatorId;
    private String probableCause;
    private String rootCause;
    private List<String> immediateActions;
    private String findings;
    private String conclusion;
    private String method;
}
