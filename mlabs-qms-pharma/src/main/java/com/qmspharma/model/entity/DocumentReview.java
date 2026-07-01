package com.qmspharma.model.entity;

import com.qmspharma.model.enums.*;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "document_reviews")
@Data
public class DocumentReview {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_type", nullable = false, length = 50)
    private ReviewType reviewType = ReviewType.PERIODIC;

    @Column(name = "review_due_date", nullable = false)
    private Instant reviewDueDate;

    @Column(name = "review_completed_date")
    private Instant reviewCompletedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_decision", length = 50)
    private ReviewDecision reviewDecision;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "next_review_date")
    private Instant nextReviewDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReviewStatus status = ReviewStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}