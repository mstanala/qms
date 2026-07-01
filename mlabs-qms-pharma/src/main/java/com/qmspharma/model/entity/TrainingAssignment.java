package com.qmspharma.model.entity;

import com.qmspharma.model.enums.*;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "training_assignments")
@Data
public class TrainingAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id", nullable = false)
    private TrainingCurriculum curriculum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id", nullable = false)
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_id", nullable = false)
    private User assignedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_reason", nullable = false, length = 100)
    private AssignmentReason assignmentReason;

    @Column(name = "due_date", nullable = false)
    private Instant dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TrainingPriority priority = TrainingPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TrainingAssignmentStatus status = TrainingAssignmentStatus.ASSIGNED;

    @Column(name = "source_record_type", length = 50)
    private String sourceRecordType;

    @Column(name = "source_record_id")
    private UUID sourceRecordId;

    @Column(name = "source_record_number", length = 50)
    private String sourceRecordNumber;

    @Column(name = "completed_date")
    private Instant completedDate;

    @Column
    private Integer score;

    @Column(nullable = false)
    private Integer attempts = 0;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    @Column(name = "expiry_date")
    private Instant expiryDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id")
    private User trainer;

    @Column(name = "trainer_comments", columnDefinition = "TEXT")
    private String trainerComments;

    @Column(name = "trainee_comments", columnDefinition = "TEXT")
    private String traineeComments;

    @Column(name = "evidence_path", length = 1000)
    private String evidencePath;

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}