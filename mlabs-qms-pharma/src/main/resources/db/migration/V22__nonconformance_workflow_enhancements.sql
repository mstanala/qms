-- V22: Nonconformance management workflow enhancements

-- Expand nonconformances status constraint for full workflow lifecycle
ALTER TABLE nonconformances DROP CONSTRAINT IF EXISTS nonconformances_status_check;
ALTER TABLE nonconformances ADD CONSTRAINT nonconformances_status_check CHECK (status IN (
    'IDENTIFIED', 'QUARANTINED', 'UNDER_REVIEW', 'UNDER_INVESTIGATION',
    'INVESTIGATION_COMPLETE', 'DISPOSITION_PENDING', 'DISPOSITION_APPROVED',
    'DISPOSITION', 'CAPA_PENDING', 'PENDING_CLOSURE',
    'IN_PROGRESS', 'CLOSED', 'REJECTED', 'VOID'
));
