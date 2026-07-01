package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AiAgentConfigResponse {
    private UUID id;
    private String agentType;
    private String displayName;
    private String description;
    private Boolean isEnabled;
    private String modelId;
    private BigDecimal temperature;
    private Integer maxTokens;
    private List<String> toolsEnabled;
    private Integer rateLimitRpm;
    private List<String> requiresApprovalFor;
}
