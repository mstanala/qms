package com.qmspharma.model.entity;

import com.qmspharma.model.enums.*;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "change_requests")
@Data
public class ChangeRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "change_number", nullable = false, unique = true, length = 50)
    private String changeNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String justification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ChangeType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ChangeCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChangeClassification classification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ChangeStatus status = ChangeStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChangePriority priority;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @Column(name = "requested_date", nullable = false)
    private Instant requestedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_owner_id", nullable = false)
    private User changeOwner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qa_reviewer_id")
    private User qaReviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ra_reviewer_id")
    private User raReviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "affected_areas", columnDefinition = "TEXT[]")
    private List<String> affectedAreas;

    @Column(name = "target_implementation_date", nullable = false)
    private Instant targetImplementationDate;

    @Column(name = "actual_implementation_date")
    private Instant actualImplementationDate;

    @Column(name = "effectiveness_check_date")
    private Instant effectivenessCheckDate;

    @Column(name = "closed_date")
    private Instant closedDate;

    @Column(name = "regulatory_filing_required", nullable = false)
    private Boolean regulatoryFilingRequired = false;

    @Column(name = "validation_required", nullable = false)
    private Boolean validationRequired = false;

    @Column(name = "validation_details", columnDefinition = "TEXT")
    private String validationDetails;

    @Column(name = "training_required", nullable = false)
    private Boolean trainingRequired = false;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "related_deviations", columnDefinition = "TEXT[]")
    private List<String> relatedDeviations;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "related_capas", columnDefinition = "TEXT[]")
    private List<String> relatedCapas;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "related_changes", columnDefinition = "TEXT[]")
    private List<String> relatedChanges;

    @Column(name = "current_workflow_step", nullable = false, length = 100)
    private String currentWorkflowStep = "Draft";

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @OneToOne(mappedBy = "changeRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private ChangeImpactAssessment impactAssessment;

    @OneToOne(mappedBy = "changeRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private ChangeRegulatoryFiling regulatoryFiling;

    @OneToMany(mappedBy = "changeRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChangeAffectedDocument> affectedDocuments = new ArrayList<>();

    @OneToMany(mappedBy = "changeRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChangeAffectedProduct> affectedProducts = new ArrayList<>();

    @OneToMany(mappedBy = "changeRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChangeImplementationTask> implementationTasks = new ArrayList<>();

    @OneToMany(mappedBy = "changeRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChangeTrainingRequirement> trainingRequirements = new ArrayList<>();

    @OneToMany(mappedBy = "changeRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChangeApproval> approvals = new ArrayList<>();

    @OneToMany(mappedBy = "changeRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChangeEffectivenessReview> effectivenessReviews = new ArrayList<>();

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

    @PrePersist
    public void prePersist() {
        if (requestedDate == null) requestedDate = Instant.now();
    }
}
