package com.qmspharma.model.entity;

import com.qmspharma.model.enums.*;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "training_curricula")
@Data
public class TrainingCurriculum {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "curriculum_code", nullable = false, unique = true, length = 50)
    private String curriculumCode;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private TrainingCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "training_type", nullable = false, length = 50)
    private TrainingType trainingType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id")
    private PlantSite plantSite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CurriculumStatus status = CurriculumStatus.DRAFT;

    @Column(name = "duration_hours", precision = 5, scale = 1)
    private BigDecimal durationHours;

    @Column(name = "passing_score")
    private Integer passingScore;

    @Column(name = "max_attempts")
    private Integer maxAttempts = 3;

    @Column(name = "validity_months")
    private Integer validityMonths;

    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory = false;

    @Column(name = "regulatory_requirement", length = 255)
    private String regulatoryRequirement;

    @Column(columnDefinition = "TEXT")
    private String prerequisites;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document relatedDocument;

    @Column(name = "effective_date")
    private Instant effectiveDate;

    @OneToMany(mappedBy = "curriculum", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TrainingAssignment> assignments = new ArrayList<>();

    @OneToMany(mappedBy = "curriculum", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TrainingSession> sessions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Version
    private Integer version = 0;
}