package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "validation_requirements")
@Data
public class ValidationRequirement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ValidationProject project;

    @Column(name = "requirement_number", nullable = false, length = 50)
    private String requirementNumber;

    @Column(name = "requirement_type", nullable = false, length = 30)
    private String requirementType;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    private String priority;

    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    private String acceptanceCriteria;

    @Column(name = "verification_method", length = 30)
    private String verificationMethod;

    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @Column(name = "test_protocol_id")
    private UUID testProtocolId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
