package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class TaskInboxResponse {
    private String taskId;
    private String taskName;
    private String taskDefinitionKey;
    private String processInstanceId;
    private String processDefinitionKey;
    private String recordType;
    private String recordId;
    private String recordNumber;
    private String assignee;
    private String description;
    private Instant createTime;
    private Instant dueDate;
    private String formKey;
    private int priority;
}