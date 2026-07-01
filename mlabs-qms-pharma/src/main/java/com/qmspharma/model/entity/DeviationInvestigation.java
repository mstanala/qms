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
@Table(name = "deviation_investigations")
@Data
public class DeviationInvestigation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviation_id", nullable = false, unique = true)
    private Deviation deviation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investigator_id", nullable = false)
    private User investigator;

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "completed_date")
    private Instant completedDate;

    @Column(name = "probable_cause", columnDefinition = "TEXT")
    private String probableCause;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(columnDefinition = "TEXT")
    private String findings;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    @Column(length = 100)
    private String method;

    @OneToMany(mappedBy = "investigation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeviationImmediateAction> immediateActions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (startDate == null) startDate = Instant.now();
    }
}
