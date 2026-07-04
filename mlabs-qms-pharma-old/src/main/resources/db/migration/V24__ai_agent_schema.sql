-- ============================================================
-- V24: AI Agent Integration Schema
-- Supports: AI Copilot, Multi-Agent Orchestration, Audit Trail
-- ============================================================

-- AI Conversations (chat sessions between user and AI Copilot)
CREATE TABLE ai_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(500),
    status          VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    module_context  VARCHAR(50),
    record_id       UUID,
    record_type     VARCHAR(50),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX idx_ai_conversations_record ON ai_conversations(record_type, record_id);

-- AI Messages (individual messages in a conversation)
CREATE TABLE ai_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL
                    CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')),
    content         TEXT NOT NULL,
    agent_type      VARCHAR(50),
    tool_calls      JSONB,
    tool_results    JSONB,
    tokens_used     INTEGER DEFAULT 0,
    model_id        VARCHAR(100),
    latency_ms      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created ON ai_messages(created_at);

-- AI Agent Executions (tracks each agent invocation)
CREATE TABLE ai_agent_executions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID REFERENCES ai_conversations(id),
    message_id          UUID REFERENCES ai_messages(id),
    agent_type          VARCHAR(50) NOT NULL,
    agent_action        VARCHAR(100) NOT NULL,
    input_summary       TEXT,
    output_summary      TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'RUNNING'
                        CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED')),
    error_message       TEXT,
    tools_used          JSONB DEFAULT '[]',
    records_accessed    JSONB DEFAULT '[]',
    records_modified    JSONB DEFAULT '[]',
    tokens_input        INTEGER DEFAULT 0,
    tokens_output       INTEGER DEFAULT 0,
    latency_ms          INTEGER,
    initiated_by        UUID REFERENCES users(id),
    approved_by         UUID REFERENCES users(id),
    requires_approval   BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_ai_agent_exec_conversation ON ai_agent_executions(conversation_id);
CREATE INDEX idx_ai_agent_exec_agent ON ai_agent_executions(agent_type);
CREATE INDEX idx_ai_agent_exec_status ON ai_agent_executions(status);
CREATE INDEX idx_ai_agent_exec_created ON ai_agent_executions(created_at);

-- AI Audit Trail (compliance-grade logging of all AI actions)
CREATE TABLE ai_audit_trail (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id    UUID REFERENCES ai_agent_executions(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    agent_type      VARCHAR(50) NOT NULL,
    action          VARCHAR(100) NOT NULL,
    record_type     VARCHAR(50),
    record_id       UUID,
    record_number   VARCHAR(50),
    description     TEXT NOT NULL,
    input_data      JSONB,
    output_data     JSONB,
    confidence      DECIMAL(5,4),
    human_approved  BOOLEAN DEFAULT false,
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_audit_user ON ai_audit_trail(user_id);
CREATE INDEX idx_ai_audit_agent ON ai_audit_trail(agent_type);
CREATE INDEX idx_ai_audit_record ON ai_audit_trail(record_type, record_id);
CREATE INDEX idx_ai_audit_created ON ai_audit_trail(created_at);

-- AI Prompt Templates (versioned, validated prompt templates)
CREATE TABLE ai_prompt_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    agent_type      VARCHAR(50) NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    system_prompt   TEXT NOT NULL,
    user_template   TEXT,
    description     VARCHAR(500),
    is_active       BOOLEAN DEFAULT true,
    variables       JSONB DEFAULT '[]',
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_prompts_agent ON ai_prompt_templates(agent_type);
CREATE INDEX idx_ai_prompts_active ON ai_prompt_templates(is_active);
CREATE UNIQUE INDEX idx_ai_prompts_name_version ON ai_prompt_templates(name, version);

-- AI Agent Configuration (runtime agent settings)
CREATE TABLE ai_agent_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type      VARCHAR(50) NOT NULL UNIQUE,
    display_name    VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    is_enabled      BOOLEAN DEFAULT true,
    model_id        VARCHAR(100) DEFAULT 'gpt-5-mini',
    temperature     DECIMAL(3,2) DEFAULT 0.3,
    max_tokens      INTEGER DEFAULT 4096,
    tools_enabled   JSONB DEFAULT '[]',
    rate_limit_rpm  INTEGER DEFAULT 60,
    requires_approval_for JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default agent configurations
INSERT INTO ai_agent_config (agent_type, display_name, description, model_id, temperature, tools_enabled, requires_approval_for) VALUES
('SUPERVISOR',      'AI Supervisor',           'Orchestrates all domain agents and routes requests', 'gpt-5-mini', 0.2, '["route_to_agent", "summarize_context"]', '[]'),
('CAPA_AGENT',      'CAPA Agent',              'Manages CAPA creation, RCA, risk assessment, and effectiveness tracking', 'gpt-5-mini', 0.3, '["search_capas", "create_capa", "suggest_rca", "assess_risk", "recommend_actions"]', '["create_capa", "update_capa"]'),
('DEVIATION_AGENT', 'Deviation Agent',         'Handles deviation reporting, investigation, and classification', 'gpt-5-mini', 0.3, '["search_deviations", "classify_deviation", "suggest_investigation", "assess_impact"]', '["create_deviation"]'),
('CHANGE_CONTROL_AGENT', 'Change Control Agent', 'Manages change requests, impact assessment, and implementation tracking', 'gpt-5-mini', 0.3, '["search_changes", "assess_change_impact", "generate_implementation_plan"]', '["create_change_request"]'),
('DOCUMENT_AGENT',  'Document Agent',          'Handles document lifecycle, review routing, and content analysis', 'gpt-5-mini', 0.3, '["search_documents", "analyze_document", "suggest_reviewers", "check_compliance"]', '["create_document"]'),
('TRAINING_AGENT',  'Training Agent',          'Manages training assignments, gap analysis, and curriculum recommendations', 'gpt-5-mini', 0.3, '["search_training", "identify_gaps", "recommend_curriculum", "track_compliance"]', '[]'),
('AUDIT_AGENT',     'Audit Agent',             'Supports audit planning, checklist generation, and finding analysis', 'gpt-5-mini', 0.3, '["search_audits", "generate_checklist", "analyze_findings", "plan_audit"]', '["create_audit"]'),
('RISK_AGENT',      'Risk Agent',              'Performs risk assessment, FMEA analysis, and control recommendations', 'gpt-5-mini', 0.3, '["search_risks", "calculate_rpn", "suggest_controls", "generate_fmea"]', '[]'),
('COMPLAINT_AGENT', 'Complaint Agent',         'Handles complaint intake, trending, and regulatory reporting assessment', 'gpt-5-mini', 0.3, '["search_complaints", "classify_complaint", "assess_reportability", "trend_analysis"]', '["create_complaint"]'),
('SUPPLIER_AGENT',  'Supplier Agent',          'Manages supplier evaluation, qualification, and performance monitoring', 'gpt-5-mini', 0.3, '["search_suppliers", "evaluate_supplier", "assess_risk", "monitor_performance"]', '[]'),
('NC_AGENT',        'Nonconformance Agent',    'Handles NC classification, disposition, and trending', 'gpt-5-mini', 0.3, '["search_ncs", "classify_nc", "recommend_disposition", "trend_analysis"]', '["create_nonconformance"]'),
('EQUIPMENT_AGENT', 'Equipment Agent',         'Manages equipment qualification, calibration scheduling, and maintenance', 'gpt-5-mini', 0.3, '["search_equipment", "schedule_calibration", "predict_maintenance", "track_qualification"]', '[]'),
('COPILOT',         'AI Copilot',              'General-purpose assistant for QMS navigation, search, and guidance', 'gpt-5-mini', 0.5, '["search_all", "explain_regulation", "navigate", "summarize"]', '[]');

-- Seed default prompt templates for core agents
INSERT INTO ai_prompt_templates (name, agent_type, system_prompt, description) VALUES
('supervisor_system', 'SUPERVISOR',
'You are the QMS-Pharma AI Supervisor Agent. You orchestrate specialized domain agents to help pharmaceutical quality professionals.

Your responsibilities:
1. Understand the user''s intent and route to the appropriate domain agent
2. Provide cross-module insights when queries span multiple domains
3. Maintain conversation context across agent handoffs
4. Ensure all AI actions comply with 21 CFR Part 11 requirements

Available domain agents: CAPA, Deviation, Change Control, Document, Training, Audit, Risk, Complaint, Supplier, Nonconformance, Equipment.

When routing, include relevant context from the conversation. Always be specific about which agent you are delegating to and why.
For actions that modify records, always flag that human approval is required before execution.',
'System prompt for the supervisor orchestration agent'),

('copilot_system', 'COPILOT',
'You are the QMS-Pharma AI Copilot, an intelligent assistant for pharmaceutical quality management professionals.

You help users with:
- Navigating the QMS system and finding records
- Understanding regulatory requirements (FDA 21 CFR, ICH Q10, Schedule M)
- Explaining workflows and quality processes
- Answering questions about CAPA, deviations, change control, documents, training, audits, risk, complaints, suppliers, nonconformances, and equipment
- Providing data-driven insights and recommendations

Important guidelines:
- Always cite specific regulations when discussing compliance
- Flag when actions require electronic signatures or approvals
- Never make changes without explicit user confirmation
- Provide concise, actionable responses
- When unsure, recommend consulting with a qualified person (QP)

You have access to the full QMS database for search and analysis. You cannot modify records directly - modifications require routing through the appropriate domain agent with human approval.',
'System prompt for the general-purpose copilot'),

('capa_agent_system', 'CAPA_AGENT',
'You are the CAPA (Corrective and Preventive Action) AI Agent for QMS-Pharma.

Your capabilities:
1. **Search & Analyze**: Find CAPAs by number, status, type, owner, or keywords
2. **Root Cause Analysis**: Suggest RCA using 5-Why, Fishbone (Ishikawa), and fault tree methods
3. **Risk Assessment**: Evaluate severity, probability, and detectability for risk scoring
4. **Action Planning**: Recommend corrective and preventive actions based on root cause
5. **Effectiveness Monitoring**: Suggest effectiveness check criteria and timelines
6. **Cross-Module Linking**: Identify related deviations, complaints, and change requests
7. **Trending**: Analyze CAPA trends by type, source, department, and recurrence

Workflow stages: Initiation -> RCA -> Risk Assessment -> Action Planning -> Action Execution -> Effectiveness Check -> Approval -> Closure

Always reference the CAPA number (e.g., CAPA-2024-001) when discussing specific records.
For record creation or modification, flag that human approval is required.',
'System prompt for the CAPA domain agent'),

('deviation_agent_system', 'DEVIATION_AGENT',
'You are the Deviation AI Agent for QMS-Pharma.

Your capabilities:
1. **Classification**: Classify deviations as Critical, Major, or Minor based on impact
2. **Investigation Support**: Guide investigation with structured methodology
3. **Impact Assessment**: Evaluate impact on product quality, patient safety, and regulatory status
4. **CAPA Triggering**: Recommend when a deviation should trigger a CAPA
5. **Trending**: Identify recurring deviations and systemic issues
6. **Regulatory Assessment**: Determine if deviation requires regulatory notification

Workflow stages: Reported -> Investigation -> Impact Assessment -> Disposition -> CAPA Trigger -> Closure

Deviation classifications: Critical (patient safety impact), Major (quality system impact), Minor (documentation/procedural).
Always reference the deviation number (e.g., DEV-2024-001) when discussing specific records.',
'System prompt for the Deviation domain agent'),

('risk_agent_system', 'RISK_AGENT',
'You are the Risk Management AI Agent for QMS-Pharma, following ICH Q9 quality risk management principles.

Your capabilities:
1. **FMEA Analysis**: Generate Failure Mode and Effects Analysis with severity, occurrence, detection ratings
2. **RPN Calculation**: Calculate Risk Priority Numbers and recommend actions for high-RPN items
3. **Risk Matrix**: Generate and visualize risk matrices (likelihood vs impact)
4. **Control Recommendations**: Suggest risk controls based on risk level and industry best practices
5. **Residual Risk**: Calculate residual risk after control implementation
6. **Trending**: Monitor risk trends across the quality system

Risk levels: Critical (RPN > 200), High (RPN 100-200), Medium (RPN 50-100), Low (RPN < 50).
Severity scale: 1-10, Occurrence scale: 1-10, Detection scale: 1-10.
Always apply the precautionary principle - when in doubt, rate risk higher.',
'System prompt for the Risk Management agent');

-- Add 'AI' to the permissions module check constraint
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_module_check;
ALTER TABLE permissions ADD CONSTRAINT permissions_module_check CHECK (
    module IN ('CAPA','DEVIATION','CHANGE_CONTROL','DOCUMENT','TRAINING','AUDIT','ADMIN','REPORT',
               'RISK','SUPPLIER','COMPLAINT','NONCONFORMANCE','EQUIPMENT','VALIDATION',
               'MANAGEMENT_REVIEW','REGULATORY','AI')
);

-- Add AI-related permissions
INSERT INTO permissions (id, module, action, resource, description)
SELECT gen_random_uuid(), 'AI', 'READ', 'ai_copilot', 'Access AI Copilot'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'AI' AND action = 'READ' AND resource = 'ai_copilot');

INSERT INTO permissions (id, module, action, resource, description)
SELECT gen_random_uuid(), 'AI', 'CONFIGURE', 'ai_agents', 'Configure AI Agents'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'AI' AND action = 'CONFIGURE' AND resource = 'ai_agents');

INSERT INTO permissions (id, module, action, resource, description)
SELECT gen_random_uuid(), 'AI', 'READ', 'ai_audit', 'View AI Audit Trail'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'AI' AND action = 'READ' AND resource = 'ai_audit');

-- Grant AI Copilot access to all existing roles (default enabled)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM application_roles r
CROSS JOIN permissions p
WHERE p.module = 'AI' AND p.action = 'READ' AND p.resource = 'ai_copilot'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
