package com.qmspharma.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "risk_controls")
@Data
public class RiskControl {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_assessment_id", nullable = false)
    private RiskAssessment riskAssessment;

    @Column(name = "control_number", nullable = false, length = 50)
    private String controlNumber;

    @Column(name = "control_type", nullable = false, length = 30)
    private String controlType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @Column(name = "implementation_date")
    private Instant implementationDate;

    @Column(name = "verification_date")
    private Instant verificationDate;

    @Column(name = "effectiveness_rating", length = 20)
    private String effectivenessRating;

    @Column(nullable = false, length = 20)
    private String status = "PLANNED";

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
