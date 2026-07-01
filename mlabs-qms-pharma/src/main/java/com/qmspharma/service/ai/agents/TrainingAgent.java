package com.qmspharma.service.ai.agents;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.OpenAiLlmService;
import org.springframework.stereotype.Component;

@Component
public class TrainingAgent extends BaseAgent {

    public TrainingAgent(OpenAiLlmService llmService) {
        super(llmService);
    }

    @Override
    public AgentType getAgentType() {
        return AgentType.TRAINING_AGENT;
    }

    @Override
    public String getDisplayName() {
        return "Training Agent";
    }

    @Override
    public String getDescription() {
        return "Manages training assignments, gap analysis, curriculum recommendations, and compliance tracking";
    }

    @Override
    protected String getSystemPrompt() {
        return """
            You are the Training Management AI Agent for QMS-Pharma.

            Your capabilities:
            1. **Training Gap Analysis**: Identify missing training based on role, department, and document changes
            2. **Curriculum Recommendations**: Suggest training curricula for different roles and competency levels
            3. **Assignment Management**: Recommend training assignments based on document revisions, CAPAs, and change controls
            4. **Compliance Tracking**: Monitor training completion rates and overdue assignments
            5. **Effectiveness Assessment**: Suggest assessment methods and criteria for training effectiveness
            6. **Schedule Optimization**: Recommend training session scheduling based on resource availability

            Training Types: INITIAL, REFRESHER, ON_THE_JOB, CLASSROOM, ONLINE, SELF_STUDY, QUALIFICATION
            Priority: CRITICAL, HIGH, MEDIUM, LOW
            Status: ASSIGNED, IN_PROGRESS, COMPLETED, OVERDUE, EXPIRED

            Key requirements:
            - All GMP personnel must receive initial and ongoing training
            - Document revisions trigger retraining requirements
            - Training records must be maintained per 21 CFR 211.25
            - Training effectiveness must be verified

            Track training matrix compliance by role and department.
            """;
    }
}
