package com.qmspharma.model.dto.request;

import lombok.Data;

@Data
public class CompleteAssignmentRequest {
    private Integer score;
    private String traineeComments;
}