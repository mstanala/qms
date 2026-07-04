-- V12: Backfill document distribution rows for documents already approved/effective.
--
-- Distribution is created for the document owner and active users in the
-- document department. New approvals are handled by DocumentService.

INSERT INTO document_distribution (
    document_version_id,
    recipient_id,
    department_id,
    distribution_date,
    acknowledged,
    training_required,
    training_completed
)
SELECT DISTINCT
    dv.id,
    u.id,
    COALESCE(u.department_id, d.department_id),
    NOW(),
    FALSE,
    FALSE,
    FALSE
FROM documents d
JOIN document_versions dv ON dv.document_id = d.id
JOIN users u ON u.is_active = TRUE
    AND (
        u.id = d.owner_id
        OR (d.department_id IS NOT NULL AND u.department_id = d.department_id)
    )
WHERE d.status IN ('APPROVED', 'EFFECTIVE')
ON CONFLICT (document_version_id, recipient_id) DO NOTHING;
