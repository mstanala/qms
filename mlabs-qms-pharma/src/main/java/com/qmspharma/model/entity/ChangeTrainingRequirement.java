package com.qmspharma.model.entity;

import com.qmspharma.model.enums.CompletionStatus;
import com.qmspharma.model.enums.TrainingType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "change_training_requirements")
@Data
public class ChangeTrainingRequirement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id", nullable = false)
    private ChangeRequest changeRequest;

    @Column(name = "training_title", nullable = false, length = 500)
    private String trainingTitle;

    @Column(name = "target_audience")
    private String targetAudience;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    @Column(name = "training_type", nullable = false, length = 30)
    private TrainingType trainingType;

    @Column(name = "due_date", nullable = false)
    private Instant dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "completion_status", nullable = false, length = 20)
    private CompletionStatus completionStatus = CompletionStatus.PENDING;

    @Column(name = "completion_percentage", nullable = false)
    private Integer completionPercentage = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
