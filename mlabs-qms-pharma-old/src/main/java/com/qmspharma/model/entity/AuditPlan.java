package com.qmspharma.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_plans")
@Data
public class AuditPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "plan_number", nullable = false, unique = true, length = 50)
    private String planNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "plan_year", nullable = false)
    private Integer planYear;

    @Column(name = "audit_type", nullable = false, length = 30)
    private String auditType;

    @Column(nullable = false, length = 30)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles", "permissions", "department", "plantSite", "organization", "manager", "userRoles", "userSecurityProfiles", "createdBy", "updatedBy"})
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Department department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plant_site_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "createdBy", "updatedBy"})
    private PlantSite plantSite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles", "permissions", "department", "plantSite", "organization", "manager", "userRoles", "userSecurityProfiles", "createdBy", "updatedBy"})
    private User approvedBy;

    @Column(name = "approved_date")
    private Instant approvedDate;

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