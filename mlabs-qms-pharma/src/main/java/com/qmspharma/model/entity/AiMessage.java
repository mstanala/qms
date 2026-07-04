package com.qmspharma.model.entity;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.model.enums.MessageRole;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "ai_messages")
@Data
@EqualsAndHashCode(callSuper = true)
public class AiMessage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessageRole role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_type", length = 50)
    private AgentType agentType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tool_calls", columnDefinition = "jsonb")
    private List<Map<String, Object>> toolCalls;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tool_results", columnDefinition = "jsonb")
    private List<Map<String, Object>> toolResults;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "model_id", length = 100)
    private String modelId;

    @Column(name = "latency_ms")
    private Integer latencyMs;
}
