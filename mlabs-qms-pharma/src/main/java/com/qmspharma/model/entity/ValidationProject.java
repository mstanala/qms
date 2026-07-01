package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "validation_projects")
@Data
public class ValidationProject {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_number", nullable = false, unique = true, length = 50)
    private String projectNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "validation_type", nullable = false, length = 30)
    private String validationType;

    @Column(nullable = false, length = 30)
    private String status = "PLANNING";

    @Column(length = 20)
    private String priority = "MEDIUM";

    @Column(name = "system_name")
    private String systemName;

    @Column(name = "process_name")
    private String processName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @Column(name = "planned_start_date")
    private Instant plannedStartDate;

    @Column(name = "planned_end_date")
    private Instant plannedEndDate;

    @Column(name = "actual_start_date")
    private Instant actualStartDate;

    @Column(name = "actual_end_date")
    private Instant actualEndDate;

    @Column(name = "iq_status", length = 20)
    private String iqStatus = "NOT_STARTED";

    @Column(name = "oq_status", length = 20)
    private String oqStatus = "NOT_STARTED";

    @Column(name = "pq_status", length = 20)
    private String pqStatus = "NOT_STARTED";

    @Column(name = "revalidation_required")
    private Boolean revalidationRequired = false;

    @Column(name = "revalidation_frequency_months")
    private Integer revalidationFrequencyMonths;

    @Column(name = "next_revalidation_date")
    private Instant nextRevalidationDate;

    @Column(name = "current_workflow_step", length = 100)
    private String currentWorkflowStep = "Planning";

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ValidationRequirement> requirements = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ValidationTestProtocol> testProtocols = new ArrayList<>();

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
