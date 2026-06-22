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
@Table(name = "audits")
@Data
public class Audit {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "audit_number", nullable = false, unique = true, length = 50)
    private String auditNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_plan_id")
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_auditor_id", nullable = false)
    private User leadAuditor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditee_department_id")
    private Department auditeeDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditee_contact_id")
    private User auditeeContact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @Column(name = "area_audited", length = 500)
    private String areaAudited;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @Column(name = "standards_reference", columnDefinition = "TEXT")
    private String standardsReference;

    @Column(name = "current_workflow_step", length = 100)
    private String currentWorkflowStep = "Planning";

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AuditFinding> findings = new ArrayList<>();

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
