package com.qmspharma.model.entity;

import com.qmspharma.model.enums.AgentExecutionStatus;
import com.qmspharma.model.enums.AgentType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "ai_agent_executions")
@Data
@EqualsAndHashCode(callSuper = true)
public class AiAgentExecution extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private AiConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id")
    private AiMessage message;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_type", nullable = false, length = 50)
    private AgentType agentType;

    @Column(name = "agent_action", nullable = false, length = 100)
    private String agentAction;

    @Column(name = "input_summary", columnDefinition = "TEXT")
    private String inputSummary;

    @Column(name = "output_summary", columnDefinition = "TEXT")
    private String outputSummary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AgentExecutionStatus status = AgentExecutionStatus.RUNNING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tools_used", columnDefinition = "jsonb")
    private List<String> toolsUsed;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "records_accessed", columnDefinition = "jsonb")
    private List<Map<String, Object>> recordsAccessed;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "records_modified", columnDefinition = "jsonb")
    private List<Map<String, Object>> recordsModified;

    @Column(name = "tokens_input")
    private Integer tokensInput;

    @Column(name = "tokens_output")
    private Integer tokensOutput;

    @Column(name = "latency_ms")
    private Integer latencyMs;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by")
    private User initiatedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "requires_approval")
    private Boolean requiresApproval = false;

    @Column(name = "completed_at")
    private Instant completedAt;
}
