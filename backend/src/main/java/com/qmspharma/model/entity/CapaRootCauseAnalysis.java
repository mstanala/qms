package com.qmspharma.model.entity;

import com.qmspharma.model.enums.RcaMethod;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "capa_root_cause_analyses")
@Data
public class CapaRootCauseAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id", nullable = false, unique = true)
    private Capa capa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RcaMethod method;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "root_causes", columnDefinition = "TEXT[]")
    private List<String> rootCauses;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "contributing_factors", columnDefinition = "TEXT[]")
    private List<String> contributingFactors;

    @Column(name = "fishbone_diagram_url", length = 1000)
    private String fishboneDiagramUrl;

    @Column(name = "completed_date")
    private Instant completedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_id")
    private User completedBy;

    @OneToMany(mappedBy = "rca", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CapaFiveWhyEntry> fiveWhyEntries = new ArrayList<>();

    @OneToMany(mappedBy = "rca", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CapaFishboneCategory> fishboneCategories = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
