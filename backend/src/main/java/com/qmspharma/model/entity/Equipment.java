package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "equipment")
@Data
public class Equipment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "equipment_number", nullable = false, unique = true, length = 50)
    private String equipmentNumber;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "equipment_type", nullable = false, length = 30)
    private String equipmentType;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";

    private String manufacturer;

    @Column(name = "model_number", length = 100)
    private String modelNumber;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "asset_tag", length = 100)
    private String assetTag;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    private String area;

    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Column(name = "installation_date")
    private LocalDate installationDate;

    @Column(name = "commissioning_date")
    private LocalDate commissioningDate;

    @Column(name = "qualification_date")
    private LocalDate qualificationDate;

    @Column(name = "next_qualification_date")
    private LocalDate nextQualificationDate;

    @Column(name = "decommission_date")
    private LocalDate decommissionDate;

    @Column(name = "qualification_status", length = 30)
    private String qualificationStatus;

    @Column(name = "calibration_required")
    private Boolean calibrationRequired = false;

    @Column(name = "calibration_frequency_days")
    private Integer calibrationFrequencyDays;

    @Column(name = "last_calibration_date")
    private LocalDate lastCalibrationDate;

    @Column(name = "next_calibration_date")
    private LocalDate nextCalibrationDate;

    @Column(name = "calibration_status", length = 20)
    private String calibrationStatus;

    @Column(name = "maintenance_frequency_days")
    private Integer maintenanceFrequencyDays;

    @Column(name = "last_maintenance_date")
    private LocalDate lastMaintenanceDate;

    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "gxp_relevant")
    private Boolean gxpRelevant = true;

    @Column(name = "computerized_system")
    private Boolean computerizedSystem = false;

    @Column(name = "data_integrity_class", length = 20)
    private String dataIntegrityClass;

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
