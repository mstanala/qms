package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "calibration_records")
@Data
public class CalibrationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "calibration_number", nullable = false, unique = true, length = 50)
    private String calibrationNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(name = "calibration_type", nullable = false, length = 30)
    private String calibrationType;

    @Column(nullable = false, length = 30)
    private String status = "SCHEDULED";

    @Column(name = "scheduled_date", nullable = false)
    private Instant scheduledDate;

    @Column(name = "performed_date")
    private Instant performedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_id")
    private User performedBy;

    @Column(length = 20)
    private String result;

    @Column(name = "standard_used")
    private String standardUsed;

    @Column(name = "standard_certificate")
    private String standardCertificate;

    @Column(name = "as_found_reading", columnDefinition = "TEXT")
    private String asFoundReading;

    @Column(name = "as_left_reading", columnDefinition = "TEXT")
    private String asLeftReading;

    @Column(length = 100)
    private String tolerance;

    @Column(length = 100)
    private String uncertainty;

    @Column(name = "adjustment_made")
    private Boolean adjustmentMade = false;

    @Column(name = "adjustment_details", columnDefinition = "TEXT")
    private String adjustmentDetails;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @Column(name = "review_date")
    private Instant reviewDate;

    @Column(name = "next_calibration_date")
    private LocalDate nextCalibrationDate;

    @Column(name = "impact_assessment_required")
    private Boolean impactAssessmentRequired = false;

    @Column(name = "impact_on_results", columnDefinition = "TEXT")
    private String impactOnResults;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviation_id")
    private Deviation deviation;

    @Column(name = "certificate_path", length = 1000)
    private String certificatePath;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
