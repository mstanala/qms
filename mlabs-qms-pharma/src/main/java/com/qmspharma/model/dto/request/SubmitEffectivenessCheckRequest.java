package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class SubmitEffectivenessCheckRequest {
    @NotBlank private String criteria;
    @NotNull private Instant checkDate;
    @NotNull private String result;
    @NotBlank private String evidence;
    private String comments;
    private Boolean requiresRecurrence;
    private Integer recurrenceMonths;
    private ESignatureRequest electronicSignature;
}
