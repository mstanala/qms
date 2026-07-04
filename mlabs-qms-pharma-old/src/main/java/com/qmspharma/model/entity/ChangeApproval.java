package com.qmspharma.model.entity;

import com.qmspharma.model.enums.ApprovalDecision;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "change_approvals")
@Data
public class ChangeApproval {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id", nullable = false)
    private ChangeRequest changeRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id", nullable = false)
    private User approver;

    @Column(nullable = false, length = 100)
    private String role;

    private String department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApprovalDecision decision = ApprovalDecision.PENDING;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "decision_date")
    private Instant decisionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "esignature_id")
    private ElectronicSignature esignature;

    @Column(name = "approval_order", nullable = false)
    private Integer approvalOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
