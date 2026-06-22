package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "document_distribution", uniqueConstraints = @UniqueConstraint(columnNames = {"document_version_id", "recipient_id"}))
@Data
public class DocumentDistribution {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_version_id", nullable = false)
    private DocumentVersion documentVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "distribution_date", nullable = false)
    private Instant distributionDate;

    @Column(nullable = false)
    private Boolean acknowledged = false;

    @Column(name = "acknowledged_date")
    private Instant acknowledgedDate;

    @Column(name = "training_required", nullable = false)
    private Boolean trainingRequired = false;

    @Column(name = "training_completed", nullable = false)
    private Boolean trainingCompleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}