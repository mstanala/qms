package com.qmspharma.model.entity;

import com.qmspharma.model.enums.*;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "deviations")
@Data
public class Deviation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "deviation_number", nullable = false, unique = true, length = 50)
    private String deviationNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeviationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeviationCategory category;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DeviationClassification classification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeviationStatus status = DeviationStatus.REPORTED;

    @Column(name = "source_area")
    private String sourceArea;

    @Column(name = "occurred_date", nullable = false)
    private Instant occurredDate;

    @Column(name = "reported_date", nullable = false)
    private Instant reportedDate;

    @Column(name = "detected_date", nullable = false)
    private Instant detectedDate;

    @Column(name = "target_closure_date", nullable = false)
    private Instant targetClosureDate;

    @Column(name = "actual_closure_date")
    private Instant actualClosureDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_id", nullable = false)
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    private String area;
    private String equipment;
    private String product;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "batch_size", length = 100)
    private String batchSize;

    @Column(name = "gmp_impact", nullable = false)
    private Boolean gmpImpact = false;

    @Column(name = "patient_safety_impact", nullable = false)
    private Boolean patientSafetyImpact = false;

    @Column(name = "regulatory_impact", nullable = false)
    private Boolean regulatoryImpact = false;

    @Column(name = "capa_required", nullable = false)
    private Boolean capaRequired = false;

    @Column(name = "capa_id")
    private UUID capaId;

    @Column(name = "current_workflow_step", nullable = false, length = 100)
    private String currentWorkflowStep = "Reported";

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @OneToMany(mappedBy = "deviation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeviationAffectedBatch> affectedBatches = new ArrayList<>();

    @OneToOne(mappedBy = "deviation", cascade = CascadeType.ALL, orphanRemoval = true)
    private DeviationInvestigation investigation;

    @OneToOne(mappedBy = "deviation", cascade = CascadeType.ALL, orphanRemoval = true)
    private DeviationImpactAssessment impactAssessment;

    @OneToOne(mappedBy = "deviation", cascade = CascadeType.ALL, orphanRemoval = true)
    private DeviationDisposition disposition;

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
