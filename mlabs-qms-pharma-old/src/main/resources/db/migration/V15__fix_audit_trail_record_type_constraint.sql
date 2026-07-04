-- V15: Add TRAINING_ASSIGNMENT and TRAINING_CURRICULUM to audit_trail record_type constraint

ALTER TABLE audit_trail DROP CONSTRAINT IF EXISTS audit_trail_record_type_check;
ALTER TABLE audit_trail ADD CONSTRAINT audit_trail_record_type_check
  CHECK (record_type IN (
    'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'USER', 'ROLE',
    'DOCUMENT', 'TRAINING', 'TRAINING_ASSIGNMENT', 'TRAINING_CURRICULUM',
    'SYSTEM_CONFIG', 'RISK_ASSESSMENT', 'AUDIT', 'SUPPLIER',
    'COMPLAINT', 'NONCONFORMANCE', 'EQUIPMENT', 'CALIBRATION',
    'VALIDATION', 'MANAGEMENT_REVIEW', 'REGULATORY_COMMITMENT'
  ));

-- Reset acknowledged distributions that have training_required=true
-- but no corresponding training assignment, so users can re-acknowledge
UPDATE document_distribution
SET acknowledged = FALSE, acknowledged_date = NULL
WHERE training_required = TRUE
  AND acknowledged = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM training_assignments ta
    JOIN training_curricula tc ON tc.id = ta.curriculum_id
    JOIN document_versions dv ON dv.document_id = tc.document_id
    WHERE ta.assigned_to_id = document_distribution.recipient_id
      AND dv.id = document_distribution.document_version_id
  );