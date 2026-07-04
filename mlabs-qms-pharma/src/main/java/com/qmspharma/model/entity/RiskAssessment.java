package com.qmspharma.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "risk_assessments")
@Data
public class RiskAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_register_id", nullable = false)
    private RiskRegister riskRegister;

    @Column(name = "assessment_number", nullable = false, unique = true, length = 50)
    private String assessmentNumber;

    @Column(name = "hazard_description", nullable = false, columnDefinition = "TEXT")
    private String hazardDescription;

    @Column(name = "harm_description", columnDefinition = "TEXT")
    private String harmDescription;

    @Column(name = "risk_category", length = 50)
    private String riskCategory;

    @Column(name = "process_step")
    private String processStep;

    // Initial Risk Scoring
    @Column(name = "initial_severity", nullable = false)
    private Integer initialSeverity;

    @Column(name = "initial_occurrence", nullable = false)
    private Integer initialOccurrence;

    @Column(name = "initial_detectability", nullable = false)
    private Integer initialDetectability;

    @Column(name = "initial_risk_level", nullable = false, length = 20)
    private String initialRiskLevel;

    // Residual Risk Scoring
    @Column(name = "residual_severity")
    private Integer residualSeverity;

    @Column(name = "residual_occurrence")
    private Integer residualOccurrence;

    @Column(name = "residual_detectability")
    private Integer residualDetectability;

    @Column(name = "residual_risk_level", length = 20)
    private String residualRiskLevel;

    // Risk Decision
    @Column(name = "risk_acceptance", length = 30)
    private String riskAcceptance;

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(nullable = false, length = 30)
    private String status = "IDENTIFIED";

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessed_by_id")
    private User assessedBy;

    @Column(name = "assessed_date")
    private Instant assessedDate;

    // Cross-Module Links
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_capa_id")
    private Capa linkedCapa;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_deviation_id")
    private Deviation linkedDeviation;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_change_id")
    private ChangeRequest linkedChange;

    @JsonIgnore
    @OneToMany(mappedBy = "riskAssessment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RiskControl> controls = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    private User updatedBy;

    @Version
    private Integer version = 1;
}
