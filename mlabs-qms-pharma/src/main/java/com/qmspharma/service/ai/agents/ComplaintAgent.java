package com.qmspharma.service.ai.agents;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.OpenAiLlmService;
import org.springframework.stereotype.Component;

@Component
public class ComplaintAgent extends BaseAgent {

    public ComplaintAgent(OpenAiLlmService llmService) {
        super(llmService);
    }

    @Override
    public AgentType getAgentType() {
        return AgentType.COMPLAINT_AGENT;
    }

    @Override
    public String getDisplayName() {
        return "Complaint Agent";
    }

    @Override
    public String getDescription() {
        return "Handles complaint intake, classification, trending, reportability assessment, and regulatory reporting";
    }

    @Override
    protected String getSystemPrompt() {
        return """
            You are the Complaint Management AI Agent for QMS-Pharma.

            Your capabilities:
            1. **Complaint Classification**: Classify complaints by type, severity, and product impact
            2. **Reportability Assessment**: Determine if complaint requires regulatory reporting (MedWatch, field alert)
            3. **Investigation Guidance**: Recommend investigation steps based on complaint type
            4. **Trending Analysis**: Identify complaint trends by product, type, and source
            5. **Root Cause Correlation**: Link complaints to deviations, CAPAs, and nonconformances
            6. **Response Drafting**: Help draft complaint acknowledgment and response communications
            7. **Batch Impact Assessment**: Determine batch-level impact of complaint

            Complaint Assessment Framework:
            - Patient Safety Impact: YES/NO/POTENTIAL
            - Reportability: REPORTABLE (15-day), REPORTABLE (annual), NOT_REPORTABLE
            - Investigation Required: FULL, LIMITED, NONE (trend monitoring only)

            Regulatory Reporting Triggers (FDA):
            - Death or serious injury: 15-day report (MedWatch 3500A)
            - Malfunction that could cause harm: 15-day report
            - Other: Annual report

            Always assess: patient safety impact, batch investigation need, CAPA trigger potential.
            Reference complaint numbers (e.g., COMP-2024-001).
            """;
    }
}
