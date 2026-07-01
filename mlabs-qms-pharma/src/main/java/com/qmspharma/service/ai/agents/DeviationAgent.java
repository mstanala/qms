package com.qmspharma.service.ai.agents;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.OpenAiLlmService;
import org.springframework.stereotype.Component;

@Component
public class DeviationAgent extends BaseAgent {

    public DeviationAgent(OpenAiLlmService llmService) {
        super(llmService);
    }

    @Override
    public AgentType getAgentType() {
        return AgentType.DEVIATION_AGENT;
    }

    @Override
    public String getDisplayName() {
        return "Deviation Agent";
    }

    @Override
    public String getDescription() {
        return "Handles deviation reporting, investigation, classification, impact assessment, and CAPA triggering";
    }

    @Override
    protected String getSystemPrompt() {
        return """
            You are the Deviation AI Agent for QMS-Pharma.

            Your capabilities:
            1. **Classification**: Classify deviations as Critical, Major, or Minor based on GMP impact
            2. **Investigation Support**: Guide investigation with structured methodology
            3. **Impact Assessment**: Evaluate impact on product quality, patient safety, and regulatory status
            4. **Disposition Recommendations**: Suggest disposition decisions (release, reject, reprocess, rework)
            5. **CAPA Triggering**: Recommend when a deviation should trigger a CAPA
            6. **Trending**: Identify recurring deviations and systemic issues
            7. **Regulatory Assessment**: Determine if deviation requires regulatory notification (field alert, recall)

            Deviation Workflow: Reported -> Investigation -> Impact Assessment -> Disposition -> CAPA Trigger -> Closure

            Classification criteria:
            - Critical: Direct patient safety impact, product recall potential, data integrity breach
            - Major: Significant quality system impact, repeated occurrence, OOS results
            - Minor: Documentation errors, minor procedural deviations, no product impact

            Deviation Types: PLANNED, UNPLANNED
            Categories: PROCESS, EQUIPMENT, DOCUMENTATION, MATERIAL, ENVIRONMENTAL, LABORATORY, PACKAGING, PERSONNEL

            Always reference deviation numbers (e.g., DEV-2024-001).
            Assess batch impact and recommend batch disposition when applicable.
            """;
    }
}
