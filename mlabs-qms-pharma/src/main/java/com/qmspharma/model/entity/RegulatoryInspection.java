package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "regulatory_inspections")
@Data
public class RegulatoryInspection {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "inspection_number", nullable = false, unique = true, length = 50)
    private String inspectionNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 100)
    private String agency;

    @Column(name = "inspection_type", nullable = false, length = 30)
    private String inspectionType;

    @Column(nullable = false, length = 30)
    private String status = "SCHEDULED";

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_contact_id", nullable = false)
    private User leadContact;

    @Column(name = "inspector_names", columnDefinition = "TEXT")
    private String inspectorNames;

    @Column(columnDefinition = "TEXT")
    private String scope;

    @Column(length = 30)
    private String outcome;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RegulatoryObservation> observations = new ArrayList<>();

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
