-- V19: Expand supplier status constraint for full workflow lifecycle
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_status_check;
ALTER TABLE suppliers ADD CONSTRAINT suppliers_status_check CHECK (status IN (
    'PENDING_QUALIFICATION', 'UNDER_EVALUATION', 'PENDING_APPROVAL',
    'CORRECTIVE_ACTION_REQUIRED', 'QUALIFIED', 'APPROVED',
    'CONDITIONALLY_APPROVED', 'ON_PROBATION', 'SUSPENDED',
    'DISQUALIFIED', 'INACTIVE', 'REJECTED'
));
