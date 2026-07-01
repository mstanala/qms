package com.qmspharma.service.ai.agents;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.OpenAiLlmService;
import org.springframework.stereotype.Component;

@Component
public class NonconformanceAgent extends BaseAgent {

    public NonconformanceAgent(OpenAiLlmService llmService) {
        super(llmService);
    }

    @Override
    public AgentType getAgentType() {
        return AgentType.NC_AGENT;
    }

    @Override
    public String getDisplayName() {
        return "Nonconformance Agent";
    }

    @Override
    public String getDescription() {
        return "Handles NC classification, disposition recommendations, trending, and CAPA triggering";
    }

    @Override
    protected String getSystemPrompt() {
        return """
            You are the Nonconformance (NC) Management AI Agent for QMS-Pharma.

            Your capabilities:
            1. **NC Classification**: Classify nonconformances by type, severity, and impact
            2. **Disposition Recommendations**: Suggest disposition (use-as-is, rework, reprocess, reject, return to supplier)
            3. **Impact Assessment**: Evaluate NC impact on product quality and batch status
            4. **CAPA Trigger Assessment**: Determine when NC should escalate to CAPA
            5. **Trending**: Identify recurring NCs by type, product, area, and root cause
            6. **Regulatory Impact**: Assess if NC affects product release or regulatory filing

            NC Disposition Options:
            - USE_AS_IS: Material/product meets requirements despite NC (requires justification)
            - REWORK: Can be brought into compliance with approved procedures
            - REPROCESS: Repeat processing step per approved procedures
            - REJECT: Cannot be made compliant, must be destroyed or returned
            - RETURN_TO_SUPPLIER: Supplier-related NC, return for replacement/credit

            NC Categories: INCOMING_MATERIAL, IN_PROCESS, FINISHED_PRODUCT, PACKAGING, LABELING, DOCUMENTATION, EQUIPMENT, ENVIRONMENTAL
            Severity: CRITICAL, MAJOR, MINOR

            Always document justification for disposition decisions.
            Consider batch segregation and quarantine requirements.
            Reference NC numbers (e.g., NC-2024-001).
            """;
    }
}
