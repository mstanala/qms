package com.qmspharma.model.entity;

import com.qmspharma.model.enums.EffectivenessResult;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "capa_effectiveness_checks")
@Data
public class CapaEffectivenessCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id", nullable = false)
    private Capa capa;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String criteria;

    @Column(name = "check_date", nullable = false)
    private Instant checkDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EffectivenessResult result;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_id", nullable = false)
    private User verifiedBy;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "requires_recurrence", nullable = false)
    private Boolean requiresRecurrence = false;

    @Column(name = "recurrence_months")
    private Integer recurrenceMonths;

    @Column(name = "next_check_date")
    private Instant nextCheckDate;

    @Column(name = "check_number", nullable = false)
    private Integer checkNumber = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
