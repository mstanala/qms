-- V21: Complaint management workflow enhancements

-- Expand complaints status constraint for full workflow lifecycle
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check CHECK (status IN (
    'RECEIVED', 'CLASSIFIED', 'UNDER_INVESTIGATION', 'INVESTIGATION_COMPLETE',
    'RESPONSE_PENDING', 'RESPONSE_SENT', 'CLOSED',
    'ACKNOWLEDGED', 'INVESTIGATION', 'ROOT_CAUSE_IDENTIFIED',
    'CAPA_INITIATED', 'PENDING_CLOSURE', 'REJECTED'
));

-- Expand recall_assessment constraint for workflow values
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_recall_assessment_check;
ALTER TABLE complaints ADD CONSTRAINT complaints_recall_assessment_check CHECK (recall_assessment IN (
    'NOT_REQUIRED', 'NO_RECALL', 'UNDER_ASSESSMENT', 'RECALL_INITIATED', 'RECALL_COMPLETED', 'VOLUNTARY', 'MANDATORY'
));

-- Ensure workflow_history accepts COMPLAINT record type
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS workflow_history_record_type_check;
ALTER TABLE workflow_history ADD CONSTRAINT workflow_history_record_type_check
    CHECK (record_type IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT',
        'RISK_ASSESSMENT', 'RISK_REGISTER', 'AUDIT', 'SUPPLIER', 'COMPLAINT', 'NONCONFORMANCE',
        'EQUIPMENT', 'VALIDATION', 'MANAGEMENT_REVIEW'
    ));
