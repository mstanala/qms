package com.qmspharma.model.entity;

import com.qmspharma.model.enums.DispositionDecision;
import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "deviation_affected_batches")
@Data
public class DeviationAffectedBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviation_id", nullable = false)
    private Deviation deviation;

    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "batch_size", length = 100)
    private String batchSize;

    @Column(name = "impact_description")
    private String impactDescription;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private DispositionDecision disposition;
}
