package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DispositionResponse {
    private UUID id;
    private String decision;
    private String justification;
    private String conditions;
    private UserRef approvedBy;
    private Instant approvedDate;
    private String qaReviewComments;
}
