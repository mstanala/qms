package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "regulatory_commitments")
@Data
public class RegulatoryCommitment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "commitment_number", nullable = false, unique = true, length = 50)
    private String commitmentNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    private String source;

    @Column(nullable = false, length = 100)
    private String agency;

    @Column(nullable = false, length = 30)
    private String status = "OPEN";

    @Column(nullable = false, length = 20)
    private String priority = "HIGH";

    @Column(name = "commitment_date", nullable = false)
    private Instant commitmentDate;

    @Column(name = "due_date", nullable = false)
    private Instant dueDate;

    @Column(name = "completed_date")
    private Instant completedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id")
    private RegulatoryInspection inspection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "observation_id")
    private RegulatoryObservation observation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id")
    private Capa capa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @Column(name = "evidence_of_completion", columnDefinition = "TEXT")
    private String evidenceOfCompletion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verification_by_id")
    private User verificationBy;

    @Column(name = "verification_date")
    private Instant verificationDate;

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
