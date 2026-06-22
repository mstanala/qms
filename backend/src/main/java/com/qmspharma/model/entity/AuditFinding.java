package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_findings")
@Data
public class AuditFinding {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private Audit audit;

    @Column(name = "finding_number", nullable = false, unique = true, length = 50)
    private String findingNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String classification;

    @Column(length = 255)
    private String area;

    @Column(name = "standard_reference")
    private String standardReference;

    @Column(name = "objective_evidence", columnDefinition = "TEXT")
    private String objectiveEvidence;

    @Column(nullable = false, length = 30)
    private String status = "OPEN";

    @Column(name = "response_due_date")
    private Instant responseDueDate;

    @Column(name = "auditee_response", columnDefinition = "TEXT")
    private String auditeeResponse;

    @Column(name = "capa_required")
    private Boolean capaRequired = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id")
    private Capa capa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_id")
    private User verifiedBy;

    @Column(name = "verified_date")
    private Instant verifiedDate;

    @Column(name = "verification_comments", columnDefinition = "TEXT")
    private String verificationComments;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
