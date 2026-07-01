package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "management_reviews")
@Data
public class ManagementReview {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "review_number", nullable = false, unique = true, length = 50)
    private String reviewNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "review_type", nullable = false, length = 30)
    private String reviewType;

    @Column(nullable = false, length = 30)
    private String status = "PLANNED";

    @Column(name = "scheduled_date", nullable = false)
    private Instant scheduledDate;

    @Column(name = "actual_date")
    private Instant actualDate;

    @Column(name = "review_period_start", nullable = false)
    private LocalDate reviewPeriodStart;

    @Column(name = "review_period_end", nullable = false)
    private LocalDate reviewPeriodEnd;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chairperson_id", nullable = false)
    private User chairperson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secretary_id")
    private User secretary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    private PlantSite plantSite;

    @Column(columnDefinition = "TEXT")
    private String agenda;

    @Column(columnDefinition = "TEXT")
    private String minutes;

    @Column(columnDefinition = "TEXT")
    private String decisions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "approved_date")
    private Instant approvedDate;

    @Column(name = "current_workflow_step", length = 100)
    private String currentWorkflowStep = "Planning";

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ManagementReviewAction> actions = new ArrayList<>();

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
