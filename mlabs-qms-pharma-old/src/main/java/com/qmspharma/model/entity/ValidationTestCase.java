package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "validation_test_cases")
@Data
public class ValidationTestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "protocol_id", nullable = false)
    private ValidationTestProtocol protocol;

    @Column(name = "test_case_number", nullable = false, length = 50)
    private String testCaseNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(name = "test_description", nullable = false, columnDefinition = "TEXT")
    private String testDescription;

    @Column(name = "acceptance_criteria", nullable = false, columnDefinition = "TEXT")
    private String acceptanceCriteria;

    @Column(columnDefinition = "TEXT")
    private String prerequisite;

    @Column(name = "test_data", columnDefinition = "TEXT")
    private String testData;

    @Column(name = "expected_result", nullable = false, columnDefinition = "TEXT")
    private String expectedResult;

    @Column(name = "actual_result", columnDefinition = "TEXT")
    private String actualResult;

    @Column(nullable = false, length = 20)
    private String status = "NOT_EXECUTED";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_by_id")
    private User executedBy;

    @Column(name = "executed_date")
    private Instant executedDate;

    @Column(name = "evidence_path", length = 1000)
    private String evidencePath;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}
