package com.qmspharma.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "complaints")
@Data
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "complaint_number", nullable = false, unique = true, length = 50)
    private String complaintNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "complaint_type", nullable = false, length = 30)
    private String complaintType;

    @Column(nullable = false, length = 30)
    private String source;

    @Column(length = 20)
    private String classification;

    @Column(nullable = false, length = 30)
    private String status = "RECEIVED";

    @Column(nullable = false, length = 20)
    private String priority = "MEDIUM";

    @Column(name = "reporter_name")
    private String reporterName;

    @Column(name = "reporter_contact")
    private String reporterContact;

    @Column(name = "reporter_type", length = 30)
    private String reporterType;

    @Column(name = "received_date", nullable = false)
    private Instant receivedDate;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_code", length = 100)
    private String productCode;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "quantity_affected", length = 100)
    private String quantityAffected;

    @Column(name = "investigation_required")
    private Boolean investigationRequired = true;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investigator_id")
    private User investigator;

    @Column(name = "investigation_start")
    private Instant investigationStart;

    @Column(name = "investigation_complete")
    private Instant investigationComplete;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    @Column(name = "is_adverse_event")
    private Boolean isAdverseEvent = false;

    @Column(name = "adverse_event_reported")
    private Boolean adverseEventReported = false;

    @Column(name = "reporting_deadline")
    private Instant reportingDeadline;

    @Column(name = "regulatory_reportable")
    private Boolean regulatoryReportable = false;

    @Column(name = "field_alert_required")
    private Boolean fieldAlertRequired = false;

    @Column(name = "recall_assessment", length = 30)
    private String recallAssessment;

    @Column(name = "capa_required")
    private Boolean capaRequired = false;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id")
    private Capa capa;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviation_id")
    private Deviation deviation;

    @Column(name = "response_due_date")
    private Instant responseDueDate;

    @Column(name = "response_sent_date")
    private Instant responseSentDate;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @Column(name = "current_workflow_step", length = 100)
    private String currentWorkflowStep = "Received";

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @Column(name = "closed_date")
    private Instant closedDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    private User updatedBy;

    @Version
    private Integer version = 1;
}
