package com.qmspharma.model.dto.request;

import lombok.Data;

import java.time.Instant;

@Data
public class UpdateImplementationTaskRequest {
    private String status;
    private String comments;
    private Instant completedDate;
}
