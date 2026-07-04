package com.qmspharma.model.entity;

import com.qmspharma.model.enums.AgentType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "ai_agent_config")
@Data
@EqualsAndHashCode(callSuper = true)
public class AiAgentConfig extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_type", nullable = false, unique = true, length = 50)
    private AgentType agentType;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(length = 500)
    private String description;

    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    @Column(name = "model_id", length = 100)
    private String modelId = "gpt-5-mini";

    @Column(precision = 3, scale = 2)
    private BigDecimal temperature = new BigDecimal("0.3");

    @Column(name = "max_tokens")
    private Integer maxTokens = 4096;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tools_enabled", columnDefinition = "jsonb")
    private List<String> toolsEnabled;

    @Column(name = "rate_limit_rpm")
    private Integer rateLimitRpm = 60;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "requires_approval_for", columnDefinition = "jsonb")
    private List<String> requiresApprovalFor;
}
