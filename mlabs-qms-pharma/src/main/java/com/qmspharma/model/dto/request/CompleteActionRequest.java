package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;

@Data
public class CompleteActionRequest {
    @NotBlank private String evidence;
    private Instant completedDate;
}
