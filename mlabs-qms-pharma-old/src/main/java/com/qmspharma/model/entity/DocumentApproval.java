package com.qmspharma.model.entity;

import com.qmspharma.model.enums.ApprovalDecisionType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "document_approvals")
@Data
public class DocumentApproval {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_version_id", nullable = false)
    private DocumentVersion documentVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id", nullable = false)
    private User approver;

    @Column(length = 100)
    private String role;

    @Column(name = "approval_order")
    private Integer approvalOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApprovalDecisionType decision = ApprovalDecisionType.PENDING;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "decision_date")
    private Instant decisionDate;

    @Column(name = "electronic_signature_id")
    private UUID electronicSignatureId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}