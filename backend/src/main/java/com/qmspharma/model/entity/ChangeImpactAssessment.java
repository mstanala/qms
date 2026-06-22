package com.qmspharma.model.entity;

import com.qmspharma.model.enums.ImpactRating;
import com.qmspharma.model.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "change_impact_assessments")
@Data
public class ChangeImpactAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id", nullable = false, unique = true)
    private ChangeRequest changeRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_quality", nullable = false, length = 20)
    private ImpactRating productQuality;

    @Enumerated(EnumType.STRING)
    @Column(name = "patient_safety", nullable = false, length = 20)
    private ImpactRating patientSafety;

    @Enumerated(EnumType.STRING)
    @Column(name = "regulatory_compliance", nullable = false, length = 20)
    private ImpactRating regulatoryCompliance;

    @Enumerated(EnumType.STRING)
    @Column(name = "validation_status", nullable = false, length = 20)
    private ImpactRating validationStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ImpactRating documentation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ImpactRating training;

    @Enumerated(EnumType.STRING)
    @Column(name = "supplier_qualification", nullable = false, length = 20)
    private ImpactRating supplierQualification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ImpactRating stability;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_risk_level", nullable = false, length = 20)
    private RiskLevel overallRiskLevel;

    @Column(name = "assessment_summary", nullable = false, columnDefinition = "TEXT")
    private String assessmentSummary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessed_by_id")
    private User assessedBy;

    @Column(name = "assessed_date")
    private Instant assessedDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
