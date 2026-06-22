package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "regulatory_observations")
@Data
public class RegulatoryObservation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private RegulatoryInspection inspection;

    @Column(name = "observation_number", nullable = false, unique = true, length = 50)
    private String observationNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String classification;

    @Column(name = "cfr_reference")
    private String cfrReference;

    @Column(length = 255)
    private String area;

    @Column(nullable = false, length = 30)
    private String status = "OPEN";

    @Column(name = "response_due_date")
    private Instant responseDueDate;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id")
    private Capa capa;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
