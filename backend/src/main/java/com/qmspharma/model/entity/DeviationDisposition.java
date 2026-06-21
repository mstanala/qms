package com.qmspharma.model.entity;

import com.qmspharma.model.enums.DispositionDecision;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deviation_dispositions")
@Data
public class DeviationDisposition {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviation_id", nullable = false, unique = true)
    private Deviation deviation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DispositionDecision decision;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String justification;

    @Column(columnDefinition = "TEXT")
    private String conditions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id", nullable = false)
    private User approvedBy;

    @Column(name = "approved_date", nullable = false)
    private Instant approvedDate;

    @Column(name = "qa_review_comments", columnDefinition = "TEXT")
    private String qaReviewComments;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (approvedDate == null) approvedDate = Instant.now();
    }
}
