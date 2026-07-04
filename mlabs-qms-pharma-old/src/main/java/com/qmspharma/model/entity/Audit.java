package com.qmspharma.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "audits")
@Data
public class Audit {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "audit_number", nullable = false, unique = true, length = 50)
    private String auditNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "audit_plan_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "owner", "department", "plantSite", "createdBy", "updatedBy", "approvedBy"})
    private AuditPlan auditPlan;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "audit_type", nullable = false, length = 30)
    private String auditType;

    @Column(name = "audit_scope", columnDefinition = "TEXT")
    private String auditScope;

    @Column(nullable = false, length = 30)
    private String status = "PLANNED";

    @Column(length = 20)
    private String priority = "MEDIUM";

    @Column(name = "scheduled_start_date", nullable = false)
    private Instant scheduledStartDate;

    @Column(name = "scheduled_end_date", nullable = false)
    private Instant scheduledEndDate;

    @Column(name = "actual_start_date")
    private Instant actualStartDate;

    @Column(name = "actual_end_date")
    private Instant actualEndDate;

    @Column(name = "report_due_date")
    private Instant reportDueDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lead_auditor_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles", "permissions", "department", "plantSite", "organization", "manager", "userRoles", "userSecurityProfiles", "createdBy", "updatedBy"})
    private User leadAuditor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "auditee_department_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "plantSite", "createdBy", "updatedBy"})
    private Department auditeeDepartment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "auditee_contact_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles", "permissions", "department", "plantSite", "organization", "manager", "userRoles", "userSecurityProfiles", "createdBy", "updatedBy"})
    private User auditeeContact;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plant_site_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "createdBy", "updatedBy"})
    private PlantSite plantSite;

    @Column(name = "area_audited", length = 500)
    private String areaAudited;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @Column(name = "standards_reference", columnDefinition = "TEXT")
    private String standardsReference;

    @Column(length = 50)
    private String category;

    @Column(name = "executive_summary", columnDefinition = "TEXT")
    private String executiveSummary;

    @Column(name = "findings_summary", columnDefinition = "TEXT")
    private String findingsSummary;

    @Column(length = 30)
    private String frequency;

    @Column(name = "proposed_action", columnDefinition = "TEXT")
    private String proposedAction;

    @Column(name = "lifecycle_state", length = 30)
    private String lifecycleState = "DRAFT";

    @Column(name = "current_workflow_step", length = 100)
    private String currentWorkflowStep = "Planning";

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<AuditFinding> findings = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnore
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    @JsonIgnore
    private User updatedBy;

    @Version
    private Integer version = 1;
}