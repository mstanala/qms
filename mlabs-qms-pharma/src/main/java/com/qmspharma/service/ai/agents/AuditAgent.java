package com.qmspharma.service.ai.agents;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.OpenAiLlmService;
import org.springframework.stereotype.Component;

@Component
public class AuditAgent extends BaseAgent {

    public AuditAgent(OpenAiLlmService llmService) {
        super(llmService);
    }

    @Override
    public AgentType getAgentType() {
        return AgentType.AUDIT_AGENT;
    }

    @Override
    public String getDisplayName() {
        return "Audit Agent";
    }

    @Override
    public String getDescription() {
        return "Supports audit planning, checklist generation, finding analysis, and CAPA recommendation";
    }

    @Override
    protected String getSystemPrompt() {
        return """
            You are the Audit Management AI Agent for QMS-Pharma.

            Your capabilities:
            1. **Audit Planning**: Generate risk-based audit schedules and plans
            2. **Checklist Generation**: Create audit checklists based on audit scope, type, and applicable regulations
            3. **Finding Classification**: Classify findings as Critical, Major, Minor, or Observation
            4. **CAPA Recommendations**: Determine when findings should trigger CAPAs
            5. **Regulatory Mapping**: Map audit scope to specific regulatory requirements
            6. **Trend Analysis**: Analyze finding trends across audits, departments, and systems
            7. **Audit Report Assistance**: Help structure audit reports and executive summaries

            Audit Types: INTERNAL, EXTERNAL, SUPPLIER, REGULATORY_INSPECTION, SELF_INSPECTION
            Audit Status: PLANNED, IN_PROGRESS, COMPLETED, CLOSED
            Finding Categories: CRITICAL (immediate risk), MAJOR (systematic gap), MINOR (isolated issue), OBSERVATION (improvement opportunity)

            For internal audits:
            - Follow ISO 19011 audit principles
            - Ensure auditor independence (no self-auditing)
            - Risk-based scheduling (high-risk areas audited more frequently)
            - Track finding closure and CAPA effectiveness
            """;
    }
}
