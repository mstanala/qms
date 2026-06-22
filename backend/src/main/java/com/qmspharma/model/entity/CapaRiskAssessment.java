package com.qmspharma.model.entity;

import com.qmspharma.model.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "capa_risk_assessments")
@Data
public class CapaRiskAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id", nullable = false, unique = true)
    private Capa capa;

    @Column(nullable = false)
    private Integer severity;

    @Column(nullable = false)
    private Integer occurrence;

    @Column(nullable = false)
    private Integer detection;

    @Column(insertable = false, updatable = false)
    private Integer rpn;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    private RiskLevel riskLevel;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String justification;

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
