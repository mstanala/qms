package com.qmspharma.model.entity;

import com.qmspharma.model.enums.ImpactLevel;
import com.qmspharma.model.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deviation_impact_assessments")
@Data
public class DeviationImpactAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviation_id", nullable = false, unique = true)
    private Deviation deviation;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_quality_impact", nullable = false, length = 20)
    private ImpactLevel productQualityImpact;

    @Enumerated(EnumType.STRING)
    @Column(name = "patient_safety_impact", nullable = false, length = 20)
    private ImpactLevel patientSafetyImpact;

    @Enumerated(EnumType.STRING)
    @Column(name = "regulatory_impact", nullable = false, length = 20)
    private ImpactLevel regulatoryImpact;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_impact", nullable = false, length = 20)
    private ImpactLevel businessImpact;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_risk_level", nullable = false, length = 20)
    private RiskLevel overallRiskLevel;

    @Column(name = "affected_products", columnDefinition = "text[]")
    private String[] affectedProducts;

    @Column(name = "affected_batches", columnDefinition = "text[]")
    private String[] affectedBatches;

    @Column(name = "batch_disposition", columnDefinition = "TEXT")
    private String batchDisposition;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String justification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessed_by_id", nullable = false)
    private User assessedBy;

    @Column(name = "assessed_date", nullable = false)
    private Instant assessedDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (assessedDate == null) assessedDate = Instant.now();
    }
}
