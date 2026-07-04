package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DocumentApprovalResponse {
    private UUID id;
    private UserRef approver;
    private String role;
    private Integer approvalOrder;
    private String decision;
    private String comments;
    private Instant decisionDate;
    private Instant createdAt;
}
