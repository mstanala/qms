package com.qmspharma.model.entity;

import com.qmspharma.model.enums.ActionStatus;
import com.qmspharma.model.enums.CapaType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "capa_actions", uniqueConstraints = @UniqueConstraint(columnNames = {"capa_id", "action_number"}))
@Data
public class CapaAction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capa_id", nullable = false)
    private Capa capa;

    @Column(name = "action_number", nullable = false, length = 50)
    private String actionNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CapaType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ActionStatus status = ActionStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id", nullable = false)
    private User assignedTo;

    @Column(name = "due_date", nullable = false)
    private Instant dueDate;

    @Column(name = "completed_date")
    private Instant completedDate;

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "evidence_url", length = 1000)
    private String evidenceUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_id")
    private User verifiedBy;

    @Column(name = "verified_date")
    private Instant verifiedDate;

    @Column(name = "verification_comments", columnDefinition = "TEXT")
    private String verificationComments;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
