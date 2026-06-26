-- V13: Set training_required = TRUE on document_distribution rows
-- for document types that require training (SOP, WORK_INSTRUCTION,
-- BATCH_RECORD, PROTOCOL, VALIDATION_PROTOCOL, MANUAL).

UPDATE document_distribution dd
SET training_required = TRUE
FROM document_versions dv
JOIN documents d ON d.id = dv.document_id
WHERE dd.document_version_id = dv.id
  AND d.document_type IN (
      'SOP', 'WORK_INSTRUCTION', 'BATCH_RECORD',
      'PROTOCOL', 'VALIDATION_PROTOCOL', 'MANUAL'
  )
  AND dd.training_required = FALSE;
