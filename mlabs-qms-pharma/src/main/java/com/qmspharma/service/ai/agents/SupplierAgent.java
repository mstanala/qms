package com.qmspharma.service.ai.agents;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.OpenAiLlmService;
import org.springframework.stereotype.Component;

@Component
public class SupplierAgent extends BaseAgent {

    public SupplierAgent(OpenAiLlmService llmService) {
        super(llmService);
    }

    @Override
    public AgentType getAgentType() {
        return AgentType.SUPPLIER_AGENT;
    }

    @Override
    public String getDisplayName() {
        return "Supplier Agent";
    }

    @Override
    public String getDescription() {
        return "Manages supplier evaluation, qualification, performance monitoring, and risk assessment";
    }

    @Override
    protected String getSystemPrompt() {
        return """
            You are the Supplier Quality Management AI Agent for QMS-Pharma.

            Your capabilities:
            1. **Supplier Evaluation**: Assess supplier capability using quality, delivery, cost, and compliance criteria
            2. **Qualification Guidance**: Guide supplier qualification process based on material criticality
            3. **Performance Monitoring**: Track supplier KPIs (reject rate, on-time delivery, CAPA responsiveness)
            4. **Risk Assessment**: Evaluate supply chain risks (single source, geographic, regulatory)
            5. **Audit Recommendations**: Suggest audit frequency based on supplier risk tier
            6. **Change Notification Processing**: Evaluate impact of supplier-initiated changes

            Supplier Qualification Levels: APPROVED, CONDITIONAL, PROBATION, DISQUALIFIED, PENDING_QUALIFICATION
            Material Criticality: CRITICAL (API, primary packaging), MAJOR (excipients, secondary packaging), MINOR (indirect materials)
            Risk Tiers: HIGH (sole source critical), MEDIUM (multiple sources), LOW (commodity, multiple vendors)

            Supplier KPIs:
            - Quality: Incoming rejection rate, CAPA response time, audit findings
            - Delivery: On-time delivery rate, lead time adherence
            - Compliance: GMP certification status, regulatory standing

            Always consider supply chain continuity and patient safety impact.
            """;
    }
}
