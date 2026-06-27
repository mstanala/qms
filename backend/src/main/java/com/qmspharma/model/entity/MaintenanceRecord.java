package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "maintenance_records")
@Data
public class MaintenanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "maintenance_number", nullable = false, unique = true, length = 50)
    private String maintenanceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(name = "maintenance_type", nullable = false, length = 30)
    private String maintenanceType;

    @Column(nullable = false, length = 30)
    private String status = "SCHEDULED";

    @Column(length = 20)
    private String priority = "MEDIUM";

    @Column(name = "scheduled_date", nullable = false)
    private Instant scheduledDate;

    @Column(name = "completed_date")
    private Instant completedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_id")
    private User performedBy;

    @Column(name = "work_performed", columnDefinition = "TEXT")
    private String workPerformed;

    @Column(name = "parts_replaced", columnDefinition = "TEXT")
    private String partsReplaced;

    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;

    @Column(name = "downtime_hours", precision = 6, scale = 1)
    private BigDecimal downtimeHours;

    @Column(name = "impact_on_production")
    private Boolean impactOnProduction = false;

    @Column(name = "requalification_required")
    private Boolean requalificationRequired = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviation_id")
    private Deviation deviation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
