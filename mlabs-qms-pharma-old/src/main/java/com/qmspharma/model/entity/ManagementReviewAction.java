package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "management_review_actions")
@Data
public class ManagementReviewAction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private ManagementReview review;

    @Column(name = "action_number", nullable = false, length = 50)
    private String actionNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id", nullable = false)
    private User assignedTo;

    @Column(name = "due_date", nullable = false)
    private Instant dueDate;

    @Column(length = 20)
    private String priority = "MEDIUM";

    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(name = "completed_date")
    private Instant completedDate;

    @Column(name = "completion_evidence", columnDefinition = "TEXT")
    private String completionEvidence;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
