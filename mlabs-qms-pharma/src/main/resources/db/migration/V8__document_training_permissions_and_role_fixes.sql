-- ============================================================================
-- V8: Add Missing DOCUMENT and TRAINING Module Permissions + Role/Profile Fixes
-- ============================================================================
-- V2 seed data only included permissions for CAPA, DEVIATION, CHANGE_CONTROL,
-- ADMIN, and REPORT. V5 added permissions for Risk, Audit, Supplier, etc. but
-- missed DOCUMENT and TRAINING modules. This script fills those gaps and updates
-- role/profile mappings accordingly.
-- ============================================================================

-- ============================================================================
-- 1. DOCUMENT MODULE PERMISSIONS
-- ============================================================================

INSERT INTO permissions (module, action, resource, description) VALUES
('DOCUMENT', 'CREATE',    'document',        'Create new documents'),
('DOCUMENT', 'READ',      'document',        'View documents'),
('DOCUMENT', 'UPDATE',    'document',        'Edit documents'),
('DOCUMENT', 'DELETE',    'document',        'Delete draft documents'),
('DOCUMENT', 'APPROVE',   'document',        'Approve documents'),
('DOCUMENT', 'REJECT',    'document',        'Reject documents'),
('DOCUMENT', 'CLOSE',     'document',        'Make documents effective/obsolete'),
('DOCUMENT', 'ASSIGN',    'document',        'Assign document reviewers'),
('DOCUMENT', 'EXPORT',    'document_report', 'Export document data and reports')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. TRAINING MODULE PERMISSIONS
-- ============================================================================

INSERT INTO permissions (module, action, resource, description) VALUES
('TRAINING', 'CREATE',    'training_record',  'Create training assignments'),
('TRAINING', 'READ',      'training_record',  'View training records'),
('TRAINING', 'UPDATE',    'training_record',  'Edit training records'),
('TRAINING', 'DELETE',    'training_record',  'Delete draft training records'),
('TRAINING', 'APPROVE',   'training_record',  'Approve training completions'),
('TRAINING', 'ASSIGN',    'training_record',  'Assign training to users'),
('TRAINING', 'CLOSE',     'training_record',  'Close/complete training records'),
('TRAINING', 'EXPORT',    'training_report',  'Export training data and reports')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. ADD AUDIT MODULE PERMISSIONS (missing ASSIGN and EXPORT)
-- ============================================================================

INSERT INTO permissions (module, action, resource, description) VALUES
('AUDIT', 'ASSIGN',    'audit',           'Assign audit team members'),
('AUDIT', 'EXPORT',    'audit_report',    'Export audit data and reports'),
('AUDIT', 'REJECT',    'audit',           'Reject audit reports'),
('AUDIT', 'DELETE',    'audit',           'Delete draft audits')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. EXPAND EXISTING role_permissions TO COVER NEW MODULES
-- ============================================================================
-- The existing role_permissions queries in V3 use broad WHERE clauses that
-- match against all permissions. Since DOCUMENT and TRAINING permissions now
-- exist, re-run the mappings for affected roles.

-- VAULT_ADMIN -> ALL permissions (including new DOCUMENT, TRAINING)
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'VAULT_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- QA_APPROVER -> APPROVE, REJECT, CLOSE, REOPEN, READ, EXPORT for new modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'QA_APPROVER'
  AND p.action IN ('APPROVE', 'REJECT', 'CLOSE', 'REOPEN', 'READ', 'EXPORT')
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- QA_REVIEWER -> READ, EXPORT, ASSIGN for new modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'QA_REVIEWER'
  AND p.action IN ('READ', 'EXPORT', 'ASSIGN')
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- APPROVER -> APPROVE, REJECT, READ for new modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'APPROVER'
  AND p.action IN ('APPROVE', 'REJECT', 'READ')
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- REVIEWER -> READ for new modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'REVIEWER'
  AND p.action = 'READ'
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- OWNER -> CREATE, READ, UPDATE, ASSIGN, DELETE for new modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'OWNER'
  AND p.action IN ('CREATE', 'READ', 'UPDATE', 'ASSIGN', 'DELETE')
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- END_USER -> Expand to include DOCUMENT READ and TRAINING READ
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'END_USER'
  AND p.action = 'READ'
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- TRAINING_ADMIN -> All TRAINING permissions + READ for all (already queries by module='TRAINING')
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'TRAINING_ADMIN'
  AND (p.module = 'TRAINING' OR (p.action = 'READ' AND p.module IN ('DOCUMENT', 'AUDIT')))
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- ============================================================================
-- 5. EXPAND SECURITY PROFILE PERMISSIONS FOR NEW MODULES
-- ============================================================================

-- System Admin Profile -> ALL (already catches everything, but ensure new perms included)
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'System Admin Profile'
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- Quality Manager Profile -> All non-ADMIN (including DOCUMENT, TRAINING)
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Quality Manager Profile'
  AND p.module NOT IN ('ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- Site Quality Head Profile -> All non-ADMIN (including DOCUMENT, TRAINING)
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Site Quality Head Profile'
  AND p.module NOT IN ('ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- Document Control Profile -> All DOCUMENT permissions + READ for others
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Document Control Profile'
  AND (p.module = 'DOCUMENT'
       OR (p.action = 'READ' AND p.module IN ('TRAINING', 'AUDIT')))
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- Training Admin Profile -> All TRAINING permissions + READ DOCUMENT
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Training Admin Profile'
  AND (p.module = 'TRAINING'
       OR (p.action = 'READ' AND p.module IN ('DOCUMENT', 'AUDIT')))
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- Auditor Profile -> READ + EXPORT + AUDIT module full access
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Auditor Profile'
  AND (p.module = 'AUDIT'
       OR (p.action IN ('READ', 'EXPORT') AND p.module IN ('DOCUMENT', 'TRAINING')))
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- QA Specialist Profile -> READ for DOCUMENT, TRAINING
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'QA Specialist Profile'
  AND p.action IN ('READ', 'EXPORT')
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- CAPA Coordinator Profile -> READ for DOCUMENT, TRAINING
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'CAPA Coordinator Profile'
  AND p.action = 'READ'
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- Investigator Profile -> READ for DOCUMENT, TRAINING
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Investigator Profile'
  AND p.action = 'READ'
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- Operator Profile -> READ for DOCUMENT, TRAINING (operators need to see SOPs and training)
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Operator Profile'
  AND p.action = 'READ'
  AND p.module IN ('DOCUMENT', 'TRAINING')
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- Change Owner Profile -> READ for DOCUMENT, TRAINING
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Change Owner Profile'
  AND p.action = 'READ'
  AND p.module IN ('DOCUMENT', 'TRAINING', 'AUDIT')
  AND NOT EXISTS (
    SELECT 1 FROM security_profile_permissions spp WHERE spp.security_profile_id = sp.id AND spp.permission_id = p.id
  );

-- ============================================================================
-- 6. ADD DOCUMENT AND TRAINING SEQUENCE COUNTERS
-- ============================================================================

INSERT INTO sequence_counters (sequence_name, year, current_value, prefix, format_pattern) VALUES
('DOCUMENT',  2025, 0, 'DOC',  '{PREFIX}-{YEAR}-{SEQ:3}'),
('DOCUMENT',  2026, 0, 'DOC',  '{PREFIX}-{YEAR}-{SEQ:3}'),
('TRAINING',  2025, 0, 'TRN',  '{PREFIX}-{YEAR}-{SEQ:3}'),
('TRAINING',  2026, 0, 'TRN',  '{PREFIX}-{YEAR}-{SEQ:3}'),
('AUDIT',     2025, 0, 'AUD',  '{PREFIX}-{YEAR}-{SEQ:3}'),
('AUDIT',     2026, 0, 'AUD',  '{PREFIX}-{YEAR}-{SEQ:3}'),
('RISK',      2025, 0, 'RISK', '{PREFIX}-{YEAR}-{SEQ:3}'),
('RISK',      2026, 0, 'RISK', '{PREFIX}-{YEAR}-{SEQ:3}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. ADD MISSING user_type VALUES FOR PHASE 2+ ROLES
-- ============================================================================
-- The user_type CHECK constraint in V1 has a limited set. We need to expand it
-- to support the PDF-documented roles like SUPPLIER_QUALITY_MANAGER,
-- COMPLAINT_HANDLER, VALIDATION_ENGINEER, MAINTENANCE_USER, EXECUTIVE,
-- and REGULATORY_AFFAIRS.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN (
        'OPERATOR', 'QA_SPECIALIST', 'QUALITY_MANAGER', 'CAPA_COORDINATOR',
        'INVESTIGATOR_SME', 'CHANGE_OWNER', 'DOC_CONTROL_SPECIALIST',
        'TRAINING_ADMIN', 'AUDITOR', 'SITE_QUALITY_HEAD', 'SYSTEM_ADMIN',
        'EXTERNAL_SUPPLIER',
        -- Phase 2+ roles
        'SUPPLIER_QUALITY_MANAGER', 'COMPLAINT_HANDLER', 'VALIDATION_ENGINEER',
        'MAINTENANCE_USER', 'EXECUTIVE', 'REGULATORY_AFFAIRS'
    ));

-- ============================================================================
-- 8. EXPAND role_level CHECK CONSTRAINT FOR ADDITIONAL ROLES
-- ============================================================================

ALTER TABLE application_roles DROP CONSTRAINT IF EXISTS application_roles_role_level_check;
ALTER TABLE application_roles ADD CONSTRAINT application_roles_role_level_check
    CHECK (role_level IN (
        'END_USER', 'OWNER', 'REVIEWER', 'APPROVER',
        'QA_REVIEWER', 'QA_APPROVER', 'TRAINING_ADMIN', 'VAULT_ADMIN',
        -- Additional levels
        'AUDITOR', 'DOC_CONTROLLER', 'EXECUTIVE'
    ));

-- ============================================================================
-- 9. ADD ADDITIONAL APPLICATION ROLES FOR PHASE 2+ MODULES
-- ============================================================================

INSERT INTO application_roles (id, name, code, description, role_level, is_system) VALUES
(gen_random_uuid(), 'Auditor',              'AUDITOR_ROLE',     'Plan and execute audits, record findings',        'AUDITOR',        TRUE),
(gen_random_uuid(), 'Document Controller',  'DOC_CONTROLLER',   'Control document lifecycle and versioning',       'DOC_CONTROLLER', TRUE),
(gen_random_uuid(), 'Executive Reviewer',   'EXECUTIVE',        'Review quality metrics and management reviews',   'EXECUTIVE',      TRUE)
ON CONFLICT DO NOTHING;

-- Assign new roles to appropriate users
-- Deepa Menon (Auditor) -> AUDITOR_ROLE
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000011', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code = 'AUDITOR_ROLE'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = 'd0000000-0000-0000-0000-000000000011' AND ur.role_id = ar.id
);

-- Kavitha Krishnan (Doc Control) -> DOC_CONTROLLER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000009', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code = 'DOC_CONTROLLER'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = 'd0000000-0000-0000-0000-000000000009' AND ur.role_id = ar.id
);

-- Srinivas Rao (Site Quality Head) -> EXECUTIVE (for management review)
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000002', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code = 'EXECUTIVE'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = 'd0000000-0000-0000-0000-000000000002' AND ur.role_id = ar.id
);

-- ============================================================================
-- 10. PERMISSIONS FOR NEW ROLES
-- ============================================================================

-- AUDITOR_ROLE -> All AUDIT permissions + READ for related modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'AUDITOR_ROLE'
  AND (p.module = 'AUDIT'
       OR (p.action IN ('READ', 'EXPORT') AND p.module IN ('DEVIATION', 'CAPA', 'CHANGE_CONTROL', 'DOCUMENT', 'TRAINING', 'REPORT')))
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- DOC_CONTROLLER -> All DOCUMENT permissions + READ for related modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'DOC_CONTROLLER'
  AND (p.module = 'DOCUMENT'
       OR (p.action = 'READ' AND p.module IN ('CHANGE_CONTROL', 'TRAINING', 'REPORT')))
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );

-- EXECUTIVE -> READ + APPROVE for MANAGEMENT_REVIEW, READ dashboards/reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'EXECUTIVE'
  AND ((p.module = 'MANAGEMENT_REVIEW')
       OR (p.action = 'READ' AND p.module = 'REPORT')
       OR (p.action IN ('READ', 'EXPORT')))
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = ar.id AND rp.permission_id = p.id
  );