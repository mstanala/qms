package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "sequence_counters", uniqueConstraints = @UniqueConstraint(columnNames = {"sequence_name", "plant_site_id", "year"}))
@Data
public class SequenceCounter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sequence_name", nullable = false, length = 100)
    private String sequenceName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id")
    private PlantSite plantSite;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "current_value", nullable = false)
    private Integer currentValue = 0;

    @Column(nullable = false, length = 20)
    private String prefix;

    @Column(name = "format_pattern", nullable = false, length = 100)
    private String formatPattern = "{PREFIX}-{YEAR}-{SEQ:3}";
}
