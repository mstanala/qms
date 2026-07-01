package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class ComplaintResponse {
    private UUID id;
    private String complaintNumber;
    private String title;
    private String description;
    private String complaintType;
    private String source;
    private String classification;
    private String status;
    private String priority;
    private String reporterName;
    private String reporterContact;
    private String reporterType;
    private Instant receivedDate;
    private String productName;
    private String productCode;
    private String batchNumber;
    private LocalDate expiryDate;
    private String quantityAffected;
    private Boolean investigationRequired;
    private ReferenceResponse investigator;
    private Instant investigationStart;
    private Instant investigationComplete;
    private String rootCause;
    private String conclusion;
    private Boolean isAdverseEvent;
    private Boolean adverseEventReported;
    private Instant reportingDeadline;
    private Boolean regulatoryReportable;
    private Boolean fieldAlertRequired;
    private String recallAssessment;
    private Boolean capaRequired;
    private UUID capaId;
    private UUID deviationId;
    private Instant responseDueDate;
    private Instant responseSentDate;
    private String responseText;
    private ReferenceResponse owner;
    private ReferenceResponse department;
    private ReferenceResponse plantSite;
    private String currentWorkflowStep;
    private String flowableProcessId;
    private Instant closedDate;
    private Instant createdAt;
    private Instant updatedAt;
}
