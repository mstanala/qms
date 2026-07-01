package com.qmspharma.model.entity;

import com.qmspharma.model.enums.*;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Data
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "document_number", nullable = false, unique = true, length = 50)
    private String documentNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DocumentType documentType;

    @Column(length = 100)
    private String category;

    @Column(name = "sub_category", length = 100)
    private String subCategory;

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
    @Column(nullable = false, length = 50)
    private DocumentStatus status = DocumentStatus.DRAFT;

    @Column(name = "current_version", length = 20)
    private String currentVersion = "1.0";

    @Column(name = "current_version_id")
    private UUID currentVersionId;

    @Column(name = "effective_date")
    private Instant effectiveDate;

    @Column(name = "expiry_date")
    private Instant expiryDate;

    @Column(name = "next_review_date")
    private Instant nextReviewDate;

    @Column(name = "review_period_months")
    private Integer reviewPeriodMonths = 24;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidentiality_level", nullable = false, length = 20)
    private ConfidentialityLevel confidentialityLevel = ConfidentialityLevel.INTERNAL;

    @Column(name = "regulatory_reference", length = 255)
    private String regulatoryReference;

    @Column(columnDefinition = "TEXT")
    private String keywords;

    @Column(name = "template_id")
    private UUID templateId;

    @Column(name = "is_template", nullable = false)
    private Boolean isTemplate = false;

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @Column(name = "current_workflow_step", length = 100)
    private String currentWorkflowStep;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentVersion> versions = new ArrayList<>();

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentReview> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "sourceDocument", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentReference> outgoingReferences = new ArrayList<>();

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