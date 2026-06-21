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
@Table(name = "capas")
@Data
public class Capa {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "capa_number", nullable = false, unique = true, length = 50)
    private String capaNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CapaType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CapaStatus status = CapaStatus.INITIATED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CapaPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 30)
    private CapaSourceType sourceType;

    @Column(name = "source_reference")
    private String sourceReference;

    @Column(name = "initiated_date", nullable = false)
    private Instant initiatedDate;

    @Column(name = "target_completion_date", nullable = false)
    private Instant targetCompletionDate;

    @Column(name = "actual_completion_date")
    private Instant actualCompletionDate;

    @Column(name = "due_date", nullable = false)
    private Instant dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiator_id", nullable = false)
    private User initiator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    private String product;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviation_id")
    private Deviation deviation;

    @Column(name = "current_workflow_step", nullable = false, length = 100)
    private String currentWorkflowStep = "Initiation";

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @Column(name = "closed_at")
    private Instant closedAt;

    @OneToOne(mappedBy = "capa", cascade = CascadeType.ALL, orphanRemoval = true)
    private CapaRootCauseAnalysis rootCauseAnalysis;

    @OneToOne(mappedBy = "capa", cascade = CascadeType.ALL, orphanRemoval = true)
    private CapaRiskAssessment riskAssessment;

    @OneToMany(mappedBy = "capa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CapaAction> actions = new ArrayList<>();

    @OneToMany(mappedBy = "capa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CapaEffectivenessCheck> effectivenessChecks = new ArrayList<>();

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
        if (initiatedDate == null) initiatedDate = Instant.now();
    }
}
