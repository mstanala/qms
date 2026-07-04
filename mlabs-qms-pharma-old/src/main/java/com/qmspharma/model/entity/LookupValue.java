package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "lookup_values", uniqueConstraints = @UniqueConstraint(columnNames = {"category", "code", "plant_site_id"}))
@Data
public class LookupValue {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 100)
    private String code;

    @Column(name = "display_value", nullable = false, length = 500)
    private String displayValue;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private LookupValue parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id")
    private PlantSite plantSite;
}
