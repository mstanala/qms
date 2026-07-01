package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AddApproverRequest {
    @NotNull private UUID approverId;
    private String role;
    private String department;
    private Integer approvalOrder;
}
