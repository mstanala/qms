-- V20: Risk management workflow enhancements

-- Expand risk_registers status constraint for full workflow lifecycle
ALTER TABLE risk_registers DROP CONSTRAINT IF EXISTS risk_registers_status_check;
ALTER TABLE risk_registers ADD CONSTRAINT risk_registers_status_check CHECK (status IN (
    'DRAFT', 'IN_ASSESSMENT', 'EVALUATION', 'CONTROL_IMPLEMENTATION',
    'RESIDUAL_RISK_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'CLOSED',
    'ACTIVE', 'UNDER_REVIEW', 'SUPERSEDED'
));

-- Update workflow_history to accept RISK_REGISTER record type
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS workflow_history_record_type_check;
ALTER TABLE workflow_history ADD CONSTRAINT workflow_history_record_type_check
    CHECK (record_type IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT',
        'RISK_ASSESSMENT', 'RISK_REGISTER', 'AUDIT', 'SUPPLIER', 'COMPLAINT', 'NONCONFORMANCE',
        'EQUIPMENT', 'VALIDATION', 'MANAGEMENT_REVIEW'
    ));

-- Add RISK_CONTROL sequence counter if not present
INSERT INTO sequence_counters (sequence_name, year, current_value, prefix, format_pattern)
SELECT 'RISK_CONTROL', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'RC', '{PREFIX}-{YEAR}-{SEQ:3}'
WHERE NOT EXISTS (SELECT 1 FROM sequence_counters WHERE sequence_name = 'RISK_CONTROL' AND year = EXTRACT(YEAR FROM NOW())::INTEGER);
