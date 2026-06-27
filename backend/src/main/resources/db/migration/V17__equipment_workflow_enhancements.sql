-- Add flowable_process_id to equipment table for workflow integration
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS flowable_process_id VARCHAR(255);

-- Relax equipment_type CHECK constraint to allow frontend values
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_equipment_type_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_equipment_type_check CHECK (equipment_type IN (
    'MANUFACTURING', 'LABORATORY', 'UTILITY', 'PACKAGING',
    'STORAGE', 'WEIGHING', 'HVAC', 'WATER_SYSTEM',
    'WAREHOUSE', 'COMPUTERIZED_SYSTEM', 'MEASURING_DEVICE', 'OTHER'
));

-- Relax equipment status CHECK to include UNDER_MAINTENANCE and UNDER_CALIBRATION
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_status_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_status_check CHECK (status IN (
    'ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'UNDER_CALIBRATION',
    'QUALIFIED', 'DECOMMISSIONED', 'OUT_OF_SERVICE'
));

-- Relax calibration_type CHECK to allow AFTER_REPAIR and OUT_OF_TOLERANCE
ALTER TABLE calibration_records DROP CONSTRAINT IF EXISTS calibration_records_calibration_type_check;
ALTER TABLE calibration_records ADD CONSTRAINT calibration_records_calibration_type_check CHECK (calibration_type IN (
    'ROUTINE', 'INITIAL', 'POST_REPAIR', 'VERIFICATION', 'SPECIAL',
    'AFTER_REPAIR', 'OUT_OF_TOLERANCE', 'PERIODIC', 'REPAIR'
));

-- Add EQUIPMENT to audit_trail record_type if not already there
ALTER TABLE audit_trail DROP CONSTRAINT IF EXISTS audit_trail_record_type_check;

-- Add maintenance permissions if not present
INSERT INTO permissions (module, action, resource, description)
SELECT 'EQUIPMENT', 'CREATE', 'maintenance', 'Create maintenance records'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'EQUIPMENT' AND action = 'CREATE' AND resource = 'maintenance');

INSERT INTO permissions (module, action, resource, description)
SELECT 'EQUIPMENT', 'UPDATE', 'maintenance', 'Edit maintenance records'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'EQUIPMENT' AND action = 'UPDATE' AND resource = 'maintenance');

INSERT INTO permissions (module, action, resource, description)
SELECT 'EQUIPMENT', 'APPROVE', 'equipment', 'Approve equipment decommission'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'EQUIPMENT' AND action = 'APPROVE' AND resource = 'equipment');