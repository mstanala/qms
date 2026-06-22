package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "capa_five_why_entries", uniqueConstraints = @UniqueConstraint(columnNames = {"rca_id", "level"}))
@Data
public class CapaFiveWhyEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rca_id", nullable = false)
    private CapaRootCauseAnalysis rca;

    @Column(nullable = false)
    private Integer level;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;
}
