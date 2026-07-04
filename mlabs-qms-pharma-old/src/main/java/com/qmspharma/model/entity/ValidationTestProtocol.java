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
@Table(name = "validation_test_protocols")
@Data
public class ValidationTestProtocol {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ValidationProject project;

    @Column(name = "protocol_number", nullable = false, unique = true, length = 50)
    private String protocolNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 20)
    private String phase;

    @Column(nullable = false, length = 30)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "approved_date")
    private Instant approvedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_by_id")
    private User executedBy;

    @Column(name = "execution_start_date")
    private Instant executionStartDate;

    @Column(name = "execution_end_date")
    private Instant executionEndDate;

    @Column(length = 20)
    private String result;

    @Column(name = "deviations_noted", columnDefinition = "TEXT")
    private String deviationsNoted;

    @OneToMany(mappedBy = "protocol", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ValidationTestCase> testCases = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
