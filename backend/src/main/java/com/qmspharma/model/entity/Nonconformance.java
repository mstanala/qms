package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nonconformances")
@Data
public class Nonconformance {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nc_number", nullable = false, unique = true, length = 50)
    private String ncNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "nc_type", nullable = false, length = 30)
    private String ncType;

    @Column(length = 20)
    private String classification;

    @Column(nullable = false, length = 30)
    private String status = "IDENTIFIED";

    @Column(nullable = false, length = 20)
    private String priority = "MEDIUM";

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_code", length = 100)
    private String productCode;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "batch_size", length = 100)
    private String batchSize;

    @Column(name = "quantity_affected", length = 100)
    private String quantityAffected;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "detected_location")
    private String detectedLocation;

    @Column(name = "stage_detected", length = 50)
    private String stageDetected;

    @Column(name = "disposition_decision", length = 30)
    private String dispositionDecision;

    @Column(name = "disposition_justification", columnDefinition = "TEXT")
    private String dispositionJustification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disposition_approved_by")
    private User dispositionApprovedBy;

    @Column(name = "disposition_date")
    private Instant dispositionDate;

    @Column(name = "hold_status", length = 20)
    private String holdStatus = "NONE";

    @Column(name = "hold_location")
    private String holdLocation;

    @Column(name = "hold_initiated_date")
    private Instant holdInitiatedDate;

    @Column(name = "hold_released_date")
    private Instant holdReleasedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hold_released_by")
    private User holdReleasedBy;

    @Column(name = "capa_required")
    private Boolean capaRequired = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id")
    private Capa capa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviation_id")
    private Deviation deviation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @Column(name = "current_workflow_step", length = 100)
    private String currentWorkflowStep = "Identified";

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    private User updatedBy;

    @Version
    private Integer version = 1;
}
