-- Add REQUALIFICATION_IN_PROGRESS to qualification_status CHECK constraint
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_qualification_status_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_qualification_status_check CHECK (qualification_status IN (
    'NOT_QUALIFIED', 'IQ_COMPLETED', 'OQ_COMPLETED', 'PQ_COMPLETED',
    'FULLY_QUALIFIED', 'REQUALIFICATION_DUE', 'QUALIFICATION_EXPIRED',
    'REQUALIFICATION_IN_PROGRESS'
));

-- Add OUT_OF_CALIBRATION to calibration_status CHECK constraint
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_calibration_status_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_calibration_status_check CHECK (calibration_status IN (
    'CALIBRATED', 'DUE', 'OVERDUE', 'NOT_APPLICABLE', 'OUT_OF_CALIBRATION'
));
