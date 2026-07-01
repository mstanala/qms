package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignInvestigatorRequest {
    @NotNull private UUID assignedToId;
    private String comments;
}
