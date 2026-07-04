-- ============================================================
-- V26: AI Suggestions (Human-in-the-Loop) & Audit Immutability
-- Supports: AI recommendation approval workflow, 21 CFR Part 11
-- ============================================================

-- AI Suggestions (pending human approval for AI recommendations)
CREATE TABLE ai_suggestions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                VARCHAR(100) NOT NULL,
    source_module       VARCHAR(50) NOT NULL,
    source_record_id    UUID,
    source_record_number VARCHAR(50),
    target_module       VARCHAR(50),
    target_record_id    UUID,
    suggestion          JSONB NOT NULL,
    confidence          DECIMAL(5,4),
    reasoning           TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'MODIFIED', 'EXPIRED')),
    agent_type          VARCHAR(50) NOT NULL,
    execution_id        UUID REFERENCES ai_agent_executions(id),
    assigned_to         UUID REFERENCES users(id),
    reviewed_by         UUID REFERENCES users(id),
    reviewed_at         TIMESTAMPTZ,
    review_comments     TEXT,
    human_modification  JSONB,
    e_signature_id      UUID REFERENCES electronic_signatures(id),
    requires_e_signature BOOLEAN DEFAULT false,
    auto_expire_at      TIMESTAMPTZ,
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status, assigned_to);
CREATE INDEX idx_ai_suggestions_module ON ai_suggestions(source_module, source_record_id);
CREATE INDEX idx_ai_suggestions_agent ON ai_suggestions(agent_type, created_at);
CREATE INDEX idx_ai_suggestions_assigned ON ai_suggestions(assigned_to) WHERE status = 'PENDING';
CREATE INDEX idx_ai_suggestions_expiry ON ai_suggestions(auto_expire_at) WHERE status = 'PENDING';

-- Immutability trigger for AI audit trail (21 CFR Part 11 compliance)
CREATE OR REPLACE FUNCTION prevent_ai_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Only allow updating human approval fields
        IF OLD.description IS DISTINCT FROM NEW.description
           OR OLD.input_data IS DISTINCT FROM NEW.input_data
           OR OLD.output_data IS DISTINCT FROM NEW.output_data
           OR OLD.agent_type IS DISTINCT FROM NEW.agent_type
           OR OLD.action IS DISTINCT FROM NEW.action THEN
            RAISE EXCEPTION 'AI audit trail core fields are immutable (21 CFR Part 11)';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'AI audit trail records cannot be deleted (21 CFR Part 11)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_audit_immutable
    BEFORE UPDATE OR DELETE ON ai_audit_trail
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ai_audit_modification();

-- Add AI suggestion permissions
INSERT INTO permissions (id, module, action, resource, description)
SELECT gen_random_uuid(), 'AI', 'APPROVE', 'ai_suggestions', 'Review and approve AI suggestions'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'AI' AND action = 'APPROVE' AND resource = 'ai_suggestions');

-- Grant AI suggestion approval to QA roles
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM application_roles r
CROSS JOIN permissions p
WHERE p.module = 'AI' AND p.action = 'APPROVE' AND p.resource = 'ai_suggestions'
AND r.name IN ('QA_MANAGER', 'QA_REVIEWER', 'QA_APPROVER', 'PLANT_ADMIN', 'VAULT_ADMIN')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
);