package com.qmspharma.model.entity;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.model.enums.AiSuggestionStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_suggestions")
@Data
@EqualsAndHashCode(callSuper = true)
public class AiSuggestion extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String type;

    @Column(name = "source_module", nullable = false, length = 50)
    private String sourceModule;

    @Column(name = "source_record_id")
    private UUID sourceRecordId;

    @Column(name = "source_record_number", length = 50)
    private String sourceRecordNumber;

    @Column(name = "target_module", length = 50)
    private String targetModule;

    @Column(name = "target_record_id")
    private UUID targetRecordId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> suggestion;

    @Column(precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(columnDefinition = "TEXT")
    private String reasoning;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiSuggestionStatus status = AiSuggestionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_type", nullable = false, length = 50)
    private AgentType agentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id")
    private AiAgentExecution execution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_comments", columnDefinition = "TEXT")
    private String reviewComments;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "human_modification", columnDefinition = "jsonb")
    private Map<String, Object> humanModification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "e_signature_id")
    private ElectronicSignature eSignature;

    @Column(name = "requires_e_signature")
    private Boolean requiresESignature = false;

    @Column(name = "auto_expire_at")
    private Instant autoExpireAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;
}
