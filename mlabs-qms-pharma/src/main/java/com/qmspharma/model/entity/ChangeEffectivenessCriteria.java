package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "change_effectiveness_criteria")
@Data
public class ChangeEffectivenessCriteria {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private ChangeEffectivenessReview review;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String criterion;

    @Column(nullable = false)
    private Boolean met;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String evidence;
}
