-- Add missing READ permission for calibration resource
INSERT INTO permissions (module, action, resource, description)
VALUES ('EQUIPMENT', 'READ', 'calibration', 'View calibration records')
ON CONFLICT DO NOTHING;

-- Grant calibration READ to all roles that already have equipment READ
INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_cal.id
FROM role_permissions rp
JOIN permissions p_eq ON rp.permission_id = p_eq.id
    AND p_eq.module = 'EQUIPMENT' AND p_eq.action = 'READ' AND p_eq.resource = 'equipment'
CROSS JOIN permissions p_cal
WHERE p_cal.module = 'EQUIPMENT' AND p_cal.action = 'READ' AND p_cal.resource = 'calibration'
ON CONFLICT DO NOTHING;
