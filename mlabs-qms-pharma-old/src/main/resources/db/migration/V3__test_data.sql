-- ============================================================================
-- QMS-Pharma Test Data - Realistic Sample Data for Full Business Flow
-- All test user passwords: Password@123
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATION
-- ============================================================================

INSERT INTO organizations (id, name, code, type, address, city, state, country, phone, email, gmp_certification, license_number)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Mechatron Pharma Pvt Ltd',
    'MECH-PHARMA',
    'MANUFACTURER',
    'Plot No. 45, Genome Valley, Shamirpet',
    'Hyderabad',
    'Telangana',
    'India',
    '+91-40-23456789',
    'info@mechatronpharma.com',
    'WHO_GMP',
    'MFG/TS/2024/001234'
);

-- ============================================================================
-- 2. PLANT SITES
-- ============================================================================

INSERT INTO plant_sites (id, organization_id, name, code, address, city, state, country, site_type, fda_registration) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
 'Genome Valley Manufacturing Unit', 'GV-MFG',
 'Plot 45, Genome Valley, Shamirpet', 'Hyderabad', 'Telangana', 'India',
 'MANUFACTURING', 'FEI-3012345'),

('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
 'Kukatpally QC Laboratory', 'KP-LAB',
 'Survey No. 12, KPHB Colony, Kukatpally', 'Hyderabad', 'Telangana', 'India',
 'LABORATORY', NULL),

('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
 'Medchal Central Warehouse', 'MC-WH',
 'Plot 78, Medchal Industrial Area', 'Medchal', 'Telangana', 'India',
 'WAREHOUSE', NULL);

-- ============================================================================
-- 3. DEPARTMENTS (Genome Valley site)
-- ============================================================================

INSERT INTO departments (id, plant_site_id, name, code, description) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Production', 'PROD', 'Manufacturing and production operations'),

('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
 'Quality Assurance', 'QA', 'Quality assurance and compliance'),

('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 'Quality Control', 'QC', 'Quality control and testing laboratory'),

('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
 'Engineering & Maintenance', 'ENG', 'Equipment maintenance and engineering'),

('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001',
 'Warehouse & Stores', 'WH', 'Material storage and distribution'),

('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001',
 'Regulatory Affairs', 'RA', 'Regulatory submissions and compliance'),

('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001',
 'Research & Development', 'RD', 'Product development and formulation');

-- Departments for QC Lab site
INSERT INTO departments (id, plant_site_id, name, code, description) VALUES
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002',
 'Analytical Lab', 'ANAL', 'Analytical testing and method development'),

('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000002',
 'Microbiology Lab', 'MICRO', 'Microbiological testing');

-- ============================================================================
-- 4. USERS (12 users covering all user types)
-- Password: Password@123 for all users
-- BCrypt hash: $2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK
-- ============================================================================

INSERT INTO users (id, employee_id, username, email, first_name, last_name, password_hash, phone, job_title, user_type, organization_id, plant_site_id, department_id, manager_id, is_active, must_change_password) VALUES

-- 1. System Administrator
('d0000000-0000-0000-0000-000000000001', 'EMP-001', 'rajesh.kumar', 'rajesh.kumar@mechatronpharma.com',
 'Rajesh', 'Kumar', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543001', 'IT Manager & System Administrator', 'SYSTEM_ADMIN',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', NULL, TRUE, FALSE),

-- 2. Site Quality Head (top of QA hierarchy)
('d0000000-0000-0000-0000-000000000002', 'EMP-002', 'srinivas.rao', 'srinivas.rao@mechatronpharma.com',
 'Srinivas', 'Rao', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543002', 'Site Quality Head', 'SITE_QUALITY_HEAD',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', NULL, TRUE, FALSE),

-- 3. Quality Manager (reports to Site QA Head)
('d0000000-0000-0000-0000-000000000003', 'EMP-003', 'priya.sharma', 'priya.sharma@mechatronpharma.com',
 'Priya', 'Sharma', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543003', 'Quality Manager', 'QUALITY_MANAGER',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', TRUE, FALSE),

-- 4. QA Specialist (reports to Quality Manager)
('d0000000-0000-0000-0000-000000000004', 'EMP-004', 'suresh.reddy', 'suresh.reddy@mechatronpharma.com',
 'Suresh', 'Reddy', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543004', 'QA Specialist', 'QA_SPECIALIST',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', TRUE, FALSE),

-- 5. CAPA Coordinator
('d0000000-0000-0000-0000-000000000005', 'EMP-005', 'anitha.rao', 'anitha.rao@mechatronpharma.com',
 'Anitha', 'Rao', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543005', 'CAPA Coordinator', 'CAPA_COORDINATOR',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', TRUE, FALSE),

-- 6. Investigator / SME
('d0000000-0000-0000-0000-000000000006', 'EMP-006', 'lakshmi.devi', 'lakshmi.devi@mechatronpharma.com',
 'Lakshmi', 'Devi', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543006', 'Senior Scientist - Investigations', 'INVESTIGATOR_SME',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', TRUE, FALSE),

-- 7. Operator (Production - initiates deviations)
('d0000000-0000-0000-0000-000000000007', 'EMP-007', 'venkat.naidu', 'venkat.naidu@mechatronpharma.com',
 'Venkat', 'Naidu', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543007', 'Production Operator', 'OPERATOR',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', TRUE, FALSE),

-- 8. Change Owner (Engineering)
('d0000000-0000-0000-0000-000000000008', 'EMP-008', 'mohammad.ali', 'mohammad.ali@mechatronpharma.com',
 'Mohammad', 'Ali', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543008', 'Engineering Manager', 'CHANGE_OWNER',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', TRUE, FALSE),

-- 9. Document Control Specialist
('d0000000-0000-0000-0000-000000000009', 'EMP-009', 'kavitha.krishnan', 'kavitha.krishnan@mechatronpharma.com',
 'Kavitha', 'Krishnan', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543009', 'Document Control Specialist', 'DOC_CONTROL_SPECIALIST',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', TRUE, FALSE),

-- 10. Training Admin
('d0000000-0000-0000-0000-000000000010', 'EMP-010', 'ravi.teja', 'ravi.teja@mechatronpharma.com',
 'Ravi', 'Teja', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543010', 'Training Manager', 'TRAINING_ADMIN',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', TRUE, FALSE),

-- 11. Auditor
('d0000000-0000-0000-0000-000000000011', 'EMP-011', 'deepa.menon', 'deepa.menon@mechatronpharma.com',
 'Deepa', 'Menon', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543011', 'Internal Auditor', 'AUDITOR',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', TRUE, FALSE),

-- 12. Second Operator (for workflow testing - different department)
('d0000000-0000-0000-0000-000000000012', 'EMP-012', 'ramesh.gupta', 'ramesh.gupta@mechatronpharma.com',
 'Ramesh', 'Gupta', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543012', 'Warehouse Operator', 'OPERATOR',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', TRUE, FALSE);

-- ============================================================================
-- 5. ROLE-PERMISSION MAPPINGS
-- ============================================================================

-- VAULT_ADMIN role -> ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'VAULT_ADMIN';

-- QA_APPROVER role -> All APPROVE, REJECT, CLOSE, READ, EXPORT permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'QA_APPROVER'
  AND p.action IN ('APPROVE', 'REJECT', 'CLOSE', 'REOPEN', 'READ', 'EXPORT');

-- QA_REVIEWER role -> READ, EXPORT, ASSIGN permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'QA_REVIEWER'
  AND p.action IN ('READ', 'EXPORT', 'ASSIGN');

-- APPROVER role -> APPROVE, REJECT, READ permissions for non-admin modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'APPROVER'
  AND p.action IN ('APPROVE', 'REJECT', 'READ')
  AND p.module != 'ADMIN';

-- REVIEWER role -> READ permissions for all modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'REVIEWER'
  AND p.action IN ('READ');

-- OWNER role -> CREATE, READ, UPDATE, ASSIGN permissions for non-admin modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'OWNER'
  AND p.action IN ('CREATE', 'READ', 'UPDATE', 'ASSIGN', 'DELETE')
  AND p.module != 'ADMIN';

-- END_USER role -> CREATE, READ, UPDATE for CAPA, DEVIATION, CHANGE_CONTROL + REPORT READ
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'END_USER'
  AND ((p.action IN ('CREATE', 'READ', 'UPDATE') AND p.module IN ('CAPA', 'DEVIATION', 'CHANGE_CONTROL'))
       OR (p.action = 'READ' AND p.module = 'REPORT'));

-- TRAINING_ADMIN role -> All TRAINING permissions + READ for all
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM application_roles ar, permissions p
WHERE ar.code = 'TRAINING_ADMIN'
  AND (p.module = 'TRAINING' OR p.action = 'READ');

-- ============================================================================
-- 6. SECURITY PROFILE-PERMISSION MAPPINGS
-- ============================================================================

-- System Admin Profile -> ALL permissions
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'System Admin Profile';

-- Quality Manager Profile -> All non-ADMIN permissions
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Quality Manager Profile'
  AND p.module != 'ADMIN';

-- QA Specialist Profile -> READ, ASSIGN, EXPORT + APPROVE for CAPA/DEVIATION
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'QA Specialist Profile'
  AND (p.action IN ('READ', 'ASSIGN', 'EXPORT')
       OR (p.action IN ('APPROVE', 'REJECT') AND p.module IN ('CAPA', 'DEVIATION')));

-- CAPA Coordinator Profile -> All CAPA + READ DEVIATION + REPORT
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'CAPA Coordinator Profile'
  AND (p.module = 'CAPA'
       OR (p.action = 'READ' AND p.module IN ('DEVIATION', 'REPORT', 'CHANGE_CONTROL')));

-- Investigator Profile -> READ all + UPDATE CAPA/DEVIATION
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Investigator Profile'
  AND (p.action = 'READ'
       OR (p.action = 'UPDATE' AND p.module IN ('CAPA', 'DEVIATION')));

-- Operator Profile -> CREATE, READ, UPDATE for DEVIATION + READ for CAPA, REPORT
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Operator Profile'
  AND ((p.action IN ('CREATE', 'READ', 'UPDATE') AND p.module = 'DEVIATION')
       OR (p.action = 'READ' AND p.module IN ('CAPA', 'REPORT')));

-- Change Owner Profile -> All CHANGE_CONTROL + READ others
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Change Owner Profile'
  AND (p.module = 'CHANGE_CONTROL'
       OR (p.action = 'READ' AND p.module IN ('DEVIATION', 'CAPA', 'REPORT')));

-- Document Control Profile -> READ all + CREATE/UPDATE CHANGE_CONTROL
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Document Control Profile'
  AND (p.action = 'READ'
       OR (p.action IN ('CREATE', 'UPDATE') AND p.module = 'CHANGE_CONTROL'));

-- Training Admin Profile -> READ all + TRAINING module
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Training Admin Profile'
  AND (p.action = 'READ' OR p.module = 'TRAINING');

-- Auditor Profile -> READ + EXPORT for all modules
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Auditor Profile'
  AND p.action IN ('READ', 'EXPORT');

-- Site Quality Head Profile -> All non-ADMIN permissions (same as Quality Manager)
INSERT INTO security_profile_permissions (security_profile_id, permission_id)
SELECT sp.id, p.id
FROM security_profiles sp, permissions p
WHERE sp.name = 'Site Quality Head Profile'
  AND p.module != 'ADMIN';

-- ============================================================================
-- 7. USER-ROLE ASSIGNMENTS
-- ============================================================================

-- Rajesh Kumar (System Admin) -> VAULT_ADMIN
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000001', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code = 'VAULT_ADMIN';

-- Srinivas Rao (Site Quality Head) -> QA_APPROVER + APPROVER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000002', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('QA_APPROVER', 'APPROVER');

-- Priya Sharma (Quality Manager) -> QA_APPROVER + APPROVER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000003', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('QA_APPROVER', 'APPROVER');

-- Suresh Reddy (QA Specialist) -> QA_REVIEWER + REVIEWER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000004', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('QA_REVIEWER', 'REVIEWER');

-- Anitha Rao (CAPA Coordinator) -> OWNER + END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000005', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('OWNER', 'END_USER');

-- Lakshmi Devi (Investigator) -> REVIEWER + END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000006', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('REVIEWER', 'END_USER');

-- Venkat Naidu (Operator) -> END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000007', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code = 'END_USER';

-- Mohammad Ali (Change Owner) -> OWNER + END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000008', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('OWNER', 'END_USER');

-- Kavitha Krishnan (Doc Control) -> END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000009', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code = 'END_USER';

-- Ravi Teja (Training Admin) -> TRAINING_ADMIN + END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000010', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('TRAINING_ADMIN', 'END_USER');

-- Deepa Menon (Auditor) -> REVIEWER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000011', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code = 'REVIEWER';

-- Ramesh Gupta (Operator 2) -> END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000012', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code = 'END_USER';

-- ============================================================================
-- 8. USER-SECURITY PROFILE ASSIGNMENTS
-- ============================================================================

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000001', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'System Admin Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000002', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Site Quality Head Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000003', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Quality Manager Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000004', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'QA Specialist Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000005', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'CAPA Coordinator Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000006', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Investigator Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000007', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Operator Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000008', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Change Owner Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000009', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Document Control Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000010', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Training Admin Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000011', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Auditor Profile';

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000012', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Operator Profile';

-- ============================================================================
-- 9. PRODUCTS
-- ============================================================================

INSERT INTO products (id, product_code, product_name, dosage_form, strength, therapeutic_category, plant_site_id) VALUES
('e0000000-0000-0000-0000-000000000001', 'AMOX-500-CAP', 'Amoxicillin Capsules IP', 'Capsule', '500mg', 'Anti-infective', 'b0000000-0000-0000-0000-000000000001'),
('e0000000-0000-0000-0000-000000000002', 'METF-500-TAB', 'Metformin Hydrochloride Tablets IP', 'Tablet', '500mg', 'Antidiabetic', 'b0000000-0000-0000-0000-000000000001'),
('e0000000-0000-0000-0000-000000000003', 'PARA-650-TAB', 'Paracetamol Tablets IP', 'Tablet', '650mg', 'Analgesic/Antipyretic', 'b0000000-0000-0000-0000-000000000001'),
('e0000000-0000-0000-0000-000000000004', 'CETI-10-TAB', 'Cetirizine Hydrochloride Tablets IP', 'Tablet', '10mg', 'Antihistamine', 'b0000000-0000-0000-0000-000000000001'),
('e0000000-0000-0000-0000-000000000005', 'OMEP-20-CAP', 'Omeprazole Capsules IP', 'Capsule', '20mg', 'Proton Pump Inhibitor', 'b0000000-0000-0000-0000-000000000001');

-- ============================================================================
-- 10. BATCHES
-- ============================================================================

INSERT INTO batches (id, batch_number, product_id, batch_size, manufacturing_date, expiry_date, status, plant_site_id) VALUES
('f0000000-0000-0000-0000-000000000001', 'AMOX-2026-001', 'e0000000-0000-0000-0000-000000000001', '500000 Capsules', '2026-01-15', '2028-01-14', 'RELEASED', 'b0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000002', 'AMOX-2026-002', 'e0000000-0000-0000-0000-000000000001', '500000 Capsules', '2026-02-20', '2028-02-19', 'RELEASED', 'b0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000003', 'METF-2026-001', 'e0000000-0000-0000-0000-000000000002', '1000000 Tablets', '2026-03-10', '2028-03-09', 'IN_PROCESS', 'b0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000004', 'METF-2026-002', 'e0000000-0000-0000-0000-000000000002', '1000000 Tablets', '2026-04-05', '2028-04-04', 'QUARANTINED', 'b0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000005', 'PARA-2026-001', 'e0000000-0000-0000-0000-000000000003', '2000000 Tablets', '2026-05-12', '2028-05-11', 'RELEASED', 'b0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000006', 'PARA-2026-002', 'e0000000-0000-0000-0000-000000000003', '2000000 Tablets', '2026-06-01', '2028-05-31', 'IN_PROCESS', 'b0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000007', 'CETI-2026-001', 'e0000000-0000-0000-0000-000000000004', '1500000 Tablets', '2026-03-25', '2028-03-24', 'RELEASED', 'b0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000008', 'OMEP-2026-001', 'e0000000-0000-0000-0000-000000000005', '750000 Capsules', '2026-04-18', '2028-04-17', 'IN_PROCESS', 'b0000000-0000-0000-0000-000000000001');

-- ============================================================================
-- 11. DEVIATIONS (3 sample deviations at different workflow stages)
-- ============================================================================

-- Update sequence counter for deviations
UPDATE sequence_counters SET current_value = 3 WHERE sequence_name = 'DEVIATION' AND year = 2026;

-- Deviation 1: CLOSED - Temperature excursion during granulation
INSERT INTO deviations (id, deviation_number, title, description, type, category, classification, status,
    source_area, occurred_date, reported_date, detected_date, target_closure_date, actual_closure_date,
    reported_by_id, assigned_to_id, reviewer_id, approved_by_id,
    plant_site_id, department_id, area, equipment, product, batch_number, batch_size,
    gmp_impact, patient_safety_impact, regulatory_impact,
    capa_required, current_workflow_step,
    created_by, updated_by)
VALUES (
    '10000000-0000-0000-0000-000000000001', 'DEV-2026-001',
    'Temperature Excursion During Granulation of Metformin 500mg',
    'During manufacturing of batch METF-2026-002, the granulation temperature exceeded the validated range of 55-65C. The temperature recorder showed a peak of 72C for approximately 15 minutes during the wet granulation step. The operator noticed the deviation when checking the temperature log and immediately stopped the granulation process. Root cause investigation required.',
    'UNPLANNED', 'PROCESS', 'MAJOR', 'CLOSED',
    'Granulation Suite - Room GR-02',
    '2026-04-05 10:30:00+05:30', '2026-04-05 11:00:00+05:30', '2026-04-05 10:45:00+05:30',
    '2026-05-05 23:59:00+05:30', '2026-04-28 16:00:00+05:30',
    'd0000000-0000-0000-0000-000000000007', -- Venkat (reported by operator)
    'd0000000-0000-0000-0000-000000000006', -- Lakshmi (investigator)
    'd0000000-0000-0000-0000-000000000004', -- Suresh (QA reviewer)
    'd0000000-0000-0000-0000-000000000003', -- Priya (QA approver)
    'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
    'Granulation Suite GR-02', 'High Shear Granulator HSG-03',
    'Metformin Hydrochloride Tablets IP 500mg', 'METF-2026-002', '1000000 Tablets',
    TRUE, FALSE, FALSE,
    TRUE, 'Closed',
    'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003'
);

-- Deviation 2: INVESTIGATION - Tablet press malfunction
INSERT INTO deviations (id, deviation_number, title, description, type, category, classification, status,
    source_area, occurred_date, reported_date, detected_date, target_closure_date,
    reported_by_id, assigned_to_id, reviewer_id,
    plant_site_id, department_id, area, equipment, product, batch_number, batch_size,
    gmp_impact, patient_safety_impact, regulatory_impact,
    capa_required, current_workflow_step,
    created_by, updated_by)
VALUES (
    '10000000-0000-0000-0000-000000000002', 'DEV-2026-002',
    'Tablet Press Compression Force Variation - Paracetamol 650mg',
    'During compression of batch PARA-2026-002, the tablet press (Cadmach CTX-45) showed intermittent compression force variations beyond +/-10% of the set point. Tablets from stations 12 and 15 were found to have hardness below specification (< 4 kp). Approximately 2000 tablets were segregated from the affected time window. The press was stopped for investigation.',
    'UNPLANNED', 'EQUIPMENT', 'MAJOR', 'INVESTIGATION',
    'Compression Suite - Room CP-01',
    '2026-06-10 14:20:00+05:30', '2026-06-10 14:45:00+05:30', '2026-06-10 14:30:00+05:30',
    '2026-07-10 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000007', -- Venkat (operator)
    'd0000000-0000-0000-0000-000000000006', -- Lakshmi (investigator)
    'd0000000-0000-0000-0000-000000000004', -- Suresh (QA reviewer)
    'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
    'Compression Suite CP-01', 'Cadmach CTX-45 Tablet Press',
    'Paracetamol Tablets IP 650mg', 'PARA-2026-002', '2000000 Tablets',
    TRUE, TRUE, FALSE,
    FALSE, 'Investigation',
    'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004'
);

-- Deviation 3: REPORTED - Raw material COA discrepancy
INSERT INTO deviations (id, deviation_number, title, description, type, category, classification, status,
    source_area, occurred_date, reported_date, detected_date, target_closure_date,
    reported_by_id,
    plant_site_id, department_id, area,
    gmp_impact, patient_safety_impact, regulatory_impact,
    capa_required, current_workflow_step,
    created_by, updated_by)
VALUES (
    '10000000-0000-0000-0000-000000000003', 'DEV-2026-003',
    'Raw Material COA Discrepancy - Cetirizine HCl API',
    'During incoming QC testing of Cetirizine HCl API (Lot: CET-API-2026-15, Supplier: Aurobindo Pharma), the assay result (98.2%) did not match the supplier Certificate of Analysis (99.5%). The difference of 1.3% exceeds the acceptable tolerance of 0.5%. Material has been quarantined pending investigation. The supplier has been notified.',
    'UNPLANNED', 'MATERIAL', NULL, 'REPORTED',
    'QC Incoming Area - Warehouse',
    '2026-06-18 09:15:00+05:30', '2026-06-18 10:00:00+05:30', '2026-06-18 09:30:00+05:30',
    '2026-07-18 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000012', -- Ramesh (warehouse operator)
    'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
    'QC Incoming Test Area',
    TRUE, FALSE, FALSE,
    FALSE, 'Reported',
    'd0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000012'
);

-- Deviation 1 Affected Batches
INSERT INTO deviation_affected_batches (deviation_id, batch_number, product_name, batch_size, impact_description, disposition) VALUES
('10000000-0000-0000-0000-000000000001', 'METF-2026-002', 'Metformin Hydrochloride Tablets IP 500mg', '1000000 Tablets',
 'Batch was in granulation stage when temperature excursion occurred. Granules from the affected period need evaluation.', 'QUARANTINE');

-- Deviation 1 Investigation (completed)
INSERT INTO deviation_investigations (id, deviation_id, investigator_id, start_date, completed_date,
    probable_cause, root_cause, findings, conclusion, method) VALUES
('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000006',
 '2026-04-06 09:00:00+05:30', '2026-04-15 17:00:00+05:30',
 'Faulty temperature sensor or heating element malfunction in the high shear granulator',
 'The PID controller temperature sensor (PT-100) on HSG-03 had drifted by +7C due to a loose connection at the terminal block. This caused the controller to under-regulate the heating, leading to overshoot.',
 'Investigation findings: 1) Temperature sensor PT-100 calibration check showed +7C drift from reference. 2) Terminal block connection was found loose during physical inspection. 3) Preventive maintenance records showed the sensor was last calibrated 8 months ago (PM schedule is 6 months). 4) No other batches manufactured between last calibration and this incident showed temperature excursions based on batch record review. 5) Granulation moisture content and LOD tests on the affected batch showed results within specification.',
 'Root cause was determined to be a drifted temperature sensor due to a loose terminal connection compounded by an overdue calibration. The affected batch granules were tested and found to meet specifications. Corrective and preventive actions are required to prevent recurrence.',
 'Five-Why Analysis');

-- Deviation 1 Immediate Actions
INSERT INTO deviation_immediate_actions (investigation_id, action_description, action_order) VALUES
('11000000-0000-0000-0000-000000000001', 'Stopped granulation process immediately and isolated the batch', 1),
('11000000-0000-0000-0000-000000000001', 'Quarantined batch METF-2026-002 granules pending investigation', 2),
('11000000-0000-0000-0000-000000000001', 'Replaced the faulty PT-100 sensor with a calibrated spare', 3),
('11000000-0000-0000-0000-000000000001', 'Performed re-calibration of all temperature sensors on HSG-03', 4);

-- Deviation 1 Impact Assessment
INSERT INTO deviation_impact_assessments (deviation_id, product_quality_impact, patient_safety_impact,
    regulatory_impact, business_impact, overall_risk_level,
    affected_products, affected_batches, batch_disposition, justification,
    assessed_by_id) VALUES
('10000000-0000-0000-0000-000000000001', 'MEDIUM', 'LOW', 'LOW', 'MEDIUM', 'MEDIUM',
 ARRAY['Metformin Hydrochloride Tablets IP 500mg'],
 ARRAY['METF-2026-002'],
 'Quarantine - pending evaluation of granule quality parameters',
 'Temperature excursion of +7C above upper limit for 15 minutes. Granule testing showed all quality attributes within specification. The excursion did not impact product dissolution or content uniformity. Risk is medium due to GMP non-compliance but actual product impact is low.',
 'd0000000-0000-0000-0000-000000000004');

-- Deviation 1 Disposition
INSERT INTO deviation_dispositions (deviation_id, decision, justification, conditions, approved_by_id, qa_review_comments) VALUES
('10000000-0000-0000-0000-000000000001', 'RELEASE_WITH_CONDITIONS',
 'Based on investigation results and batch testing data, the granules from batch METF-2026-002 meet all quality specifications. LOD, particle size distribution, and content uniformity are within acceptance criteria.',
 'Additional dissolution testing at 3 time points (15, 30, 45 min) to be performed on finished tablets. Stability samples to be placed on accelerated stability.',
 'd0000000-0000-0000-0000-000000000003',
 'Reviewed investigation findings and batch test results. Concur with release with conditions. CAPA required for temperature monitoring system improvements.');

-- Deviation 2 Investigation (in progress)
INSERT INTO deviation_investigations (id, deviation_id, investigator_id, start_date,
    probable_cause, method) VALUES
('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
 'd0000000-0000-0000-0000-000000000006',
 '2026-06-11 09:00:00+05:30',
 'Possible causes: 1) Worn punch tooling on stations 12 and 15, 2) Feeder frame alignment issue, 3) Granule flow inconsistency',
 'Fishbone Analysis');

-- ============================================================================
-- 12. CAPAs (3 sample CAPAs at different workflow stages)
-- ============================================================================

-- Update sequence counter for CAPAs
UPDATE sequence_counters SET current_value = 3 WHERE sequence_name = 'CAPA' AND year = 2026;

-- CAPA 1: CLOSED - From Deviation 1 (temperature monitoring improvement)
INSERT INTO capas (id, capa_number, title, description, type, status, priority, source_type, source_reference,
    initiated_date, target_completion_date, actual_completion_date, due_date,
    initiator_id, owner_id, department_id, plant_site_id,
    product, batch_number, deviation_id,
    current_workflow_step, closed_at,
    created_by, updated_by)
VALUES (
    '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001',
    'Temperature Monitoring System Enhancement for Granulation Equipment',
    'Implement corrective and preventive actions to prevent temperature excursion recurrence in granulation equipment. This includes enhancing the calibration program, installing redundant temperature sensors, and updating SOPs for temperature monitoring during granulation.',
    'CORRECTIVE_AND_PREVENTIVE', 'CLOSED', 'HIGH', 'DEVIATION', 'DEV-2026-001',
    '2026-04-16 09:00:00+05:30', '2026-05-30 23:59:00+05:30', '2026-05-25 16:00:00+05:30', '2026-05-30 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000004', -- Suresh (QA) initiated
    'd0000000-0000-0000-0000-000000000005', -- Anitha (CAPA coord) owns
    'c0000000-0000-0000-0000-000000000004', -- Engineering dept
    'b0000000-0000-0000-0000-000000000001',
    'Metformin Hydrochloride Tablets IP 500mg', 'METF-2026-002',
    '10000000-0000-0000-0000-000000000001',
    'Closed', '2026-05-28 10:00:00+05:30',
    'd0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003'
);

-- Link CAPA to deviation
UPDATE deviations SET capa_id = '20000000-0000-0000-0000-000000000001' WHERE id = '10000000-0000-0000-0000-000000000001';

-- CAPA 1 Root Cause Analysis
INSERT INTO capa_root_cause_analyses (id, capa_id, method, description,
    root_causes, contributing_factors, completed_date, completed_by_id) VALUES
('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 'FIVE_WHY',
 'Five-Why analysis performed to determine root cause of temperature excursion during granulation of batch METF-2026-002.',
 ARRAY['Temperature sensor PT-100 drift due to loose terminal connection', 'Overdue preventive maintenance calibration schedule'],
 ARRAY['Lack of redundant temperature monitoring', 'No automated alert system for calibration due dates', 'Manual temperature monitoring SOP not followed during deviation'],
 '2026-04-20 15:00:00+05:30', 'd0000000-0000-0000-0000-000000000006');

-- CAPA 1 Five-Why Entries
INSERT INTO capa_five_why_entries (rca_id, level, question, answer) VALUES
('21000000-0000-0000-0000-000000000001', 1, 'Why did the temperature exceed the validated range?', 'The PID controller was receiving incorrect temperature readings from the sensor.'),
('21000000-0000-0000-0000-000000000001', 2, 'Why was the sensor providing incorrect readings?', 'The PT-100 temperature sensor had drifted by +7C from its reference value.'),
('21000000-0000-0000-0000-000000000001', 3, 'Why did the sensor drift?', 'A loose terminal block connection caused intermittent signal degradation and drift.'),
('21000000-0000-0000-0000-000000000001', 4, 'Why was the loose connection not detected earlier?', 'The preventive maintenance calibration was overdue by 2 months (last done 8 months ago vs 6-month schedule).'),
('21000000-0000-0000-0000-000000000001', 5, 'Why was the calibration overdue?', 'No automated tracking system for calibration due dates; relies on manual spreadsheet tracking which was not updated.');

-- CAPA 1 Risk Assessment
INSERT INTO capa_risk_assessments (capa_id, severity, occurrence, detection, risk_level, justification, assessed_by_id) VALUES
('20000000-0000-0000-0000-000000000001', 3, 3, 4, 'HIGH',
 'Severity: 3 (Product quality impact possible but batch met specs). Occurrence: 3 (Can recur if calibration is missed on other equipment). Detection: 4 (Detected only after excursion occurred, no proactive alert). RPN = 36. Risk classified as HIGH due to potential for undetected excursions on other equipment.',
 'd0000000-0000-0000-0000-000000000005');

-- CAPA 1 Actions (all completed and verified)
INSERT INTO capa_actions (id, capa_id, action_number, description, type, status,
    assigned_to_id, due_date, completed_date, evidence, verified_by_id, verified_date, verification_comments) VALUES

('22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001-CA-01',
 'Replace all PT-100 sensors on HSG-01, HSG-02, and HSG-03 with new calibrated sensors. Tighten all terminal block connections.',
 'CORRECTIVE', 'VERIFIED',
 'd0000000-0000-0000-0000-000000000008', '2026-05-01 23:59:00+05:30', '2026-04-28 14:00:00+05:30',
 'All 9 sensors replaced. Calibration certificates attached. Terminal connections torqued to specification.',
 'd0000000-0000-0000-0000-000000000004', '2026-04-30 10:00:00+05:30',
 'Verified sensor replacement on all 3 granulators. Calibration certificates reviewed and found satisfactory.'),

('22000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001-CA-02',
 'Install redundant temperature sensors on all high shear granulators with independent display and alarm system.',
 'CORRECTIVE', 'VERIFIED',
 'd0000000-0000-0000-0000-000000000008', '2026-05-15 23:59:00+05:30', '2026-05-12 16:00:00+05:30',
 'Redundant sensors installed on HSG-01, HSG-02, HSG-03. IQ/OQ completed. Alarm setpoints configured at 63C (warning) and 66C (critical).',
 'd0000000-0000-0000-0000-000000000004', '2026-05-14 11:00:00+05:30',
 'Verified installation, IQ/OQ protocols reviewed. Alarm testing successful on all units.'),

('22000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001-PA-01',
 'Implement automated calibration tracking system with email alerts 30 days, 15 days, and 7 days before due date.',
 'PREVENTIVE', 'VERIFIED',
 'd0000000-0000-0000-0000-000000000001', '2026-05-20 23:59:00+05:30', '2026-05-18 15:00:00+05:30',
 'Calibration tracking module configured in CMMS. Email notifications set up for 30/15/7 day reminders. All critical instruments loaded into system.',
 'd0000000-0000-0000-0000-000000000005', '2026-05-20 09:00:00+05:30',
 'System tested with sample reminders. All equipment entered correctly. Escalation rules configured.'),

('22000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001-PA-02',
 'Revise SOP-PROD-015 "Temperature Monitoring During Granulation" to include: mandatory 15-min temperature checks, dual sensor verification procedure, and immediate action protocol for excursions.',
 'PREVENTIVE', 'VERIFIED',
 'd0000000-0000-0000-0000-000000000009', '2026-05-25 23:59:00+05:30', '2026-05-22 12:00:00+05:30',
 'SOP-PROD-015 Rev 03 approved and effective. Training completed for all production operators.',
 'd0000000-0000-0000-0000-000000000003', '2026-05-24 14:00:00+05:30',
 'Reviewed revised SOP. Training records verified for all 8 production operators. SOP effective date confirmed.');

-- CAPA 1 Effectiveness Check
INSERT INTO capa_effectiveness_checks (capa_id, criteria, check_date, result, evidence, verified_by_id, comments,
    requires_recurrence, recurrence_months, next_check_date, check_number) VALUES
('20000000-0000-0000-0000-000000000001',
 'No temperature excursions on any granulation equipment for 30 days after implementation. All calibrations completed on schedule.',
 '2026-05-25 10:00:00+05:30', 'EFFECTIVE',
 'Review of 30-day post-implementation data shows: 1) Zero temperature excursions across all 3 granulators. 2) All scheduled calibrations completed on time with automated reminders functioning. 3) Production operators demonstrate understanding of revised SOP during interviews.',
 'd0000000-0000-0000-0000-000000000003',
 'CAPA actions are effective. Recommend 90-day follow-up check to confirm sustained effectiveness.',
 TRUE, 3, '2026-08-25 10:00:00+05:30', 1);

-- CAPA 2: ACTION_IN_PROGRESS - From audit finding (SOP training gaps)
INSERT INTO capas (id, capa_number, title, description, type, status, priority, source_type, source_reference,
    initiated_date, target_completion_date, due_date,
    initiator_id, owner_id, department_id, plant_site_id,
    current_workflow_step,
    created_by, updated_by)
VALUES (
    '20000000-0000-0000-0000-000000000002', 'CAPA-2026-002',
    'SOP Training Compliance Improvement Program',
    'Internal audit finding #IA-2026-03 identified that 35% of production operators had not completed required SOP training within the mandated 30-day window after SOP revision. This presents a GMP compliance risk and requires corrective and preventive actions to improve training completion rates.',
    'PREVENTIVE', 'ACTION_IN_PROGRESS', 'HIGH', 'AUDIT_FINDING', 'IA-2026-03',
    '2026-05-10 09:00:00+05:30', '2026-07-31 23:59:00+05:30', '2026-07-31 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000011', -- Deepa (auditor) initiated
    'd0000000-0000-0000-0000-000000000010', -- Ravi (training admin) owns
    'c0000000-0000-0000-0000-000000000002', -- QA dept
    'b0000000-0000-0000-0000-000000000001',
    'Action Execution',
    'd0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000010'
);

-- CAPA 2 Root Cause Analysis
INSERT INTO capa_root_cause_analyses (id, capa_id, method, description,
    root_causes, contributing_factors, completed_date, completed_by_id) VALUES
('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
 'FISHBONE',
 'Ishikawa fishbone analysis to identify root causes for SOP training non-compliance.',
 ARRAY['No automated notification system for new/revised SOP training assignments', 'Training completion tracking relies on manual spreadsheet maintained by department heads'],
 ARRAY['High production workload limits operator availability for training', 'No dedicated training room - operators must leave production floor', 'Training records stored in paper format making compliance tracking difficult'],
 '2026-05-20 16:00:00+05:30', 'd0000000-0000-0000-0000-000000000010');

-- CAPA 2 Fishbone Categories
INSERT INTO capa_fishbone_categories (rca_id, category_name, causes) VALUES
('21000000-0000-0000-0000-000000000002', 'People', ARRAY['Operators prioritize production over training', 'Department heads not accountable for training completion']),
('21000000-0000-0000-0000-000000000002', 'Process', ARRAY['No automated training assignment workflow', 'Manual tracking via spreadsheets', 'No escalation mechanism for overdue training']),
('21000000-0000-0000-0000-000000000002', 'Environment', ARRAY['No dedicated training room on production floor', 'Shift timing conflicts with training sessions']),
('21000000-0000-0000-0000-000000000002', 'Technology', ARRAY['No e-learning platform available', 'Paper-based training records difficult to track']);

-- CAPA 2 Actions (mix of completed and in-progress)
INSERT INTO capa_actions (id, capa_id, action_number, description, type, status,
    assigned_to_id, due_date, completed_date, evidence) VALUES

('22000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'CAPA-2026-002-CA-01',
 'Complete all overdue SOP training for production operators. Schedule makeup sessions during shift overlaps.',
 'CORRECTIVE', 'COMPLETED',
 'd0000000-0000-0000-0000-000000000010', '2026-06-15 23:59:00+05:30', '2026-06-10 17:00:00+05:30',
 'All 12 overdue training sessions completed. Attendance records and assessment results attached.'),

('22000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 'CAPA-2026-002-PA-01',
 'Implement automated SOP training assignment system with email notifications and dashboard tracking.',
 'PREVENTIVE', 'IN_PROGRESS',
 'd0000000-0000-0000-0000-000000000001', '2026-07-15 23:59:00+05:30', NULL, NULL),

('22000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'CAPA-2026-002-PA-02',
 'Set up a dedicated training area within the production block with computer terminals for e-learning modules.',
 'PREVENTIVE', 'IN_PROGRESS',
 'd0000000-0000-0000-0000-000000000008', '2026-07-31 23:59:00+05:30', NULL, NULL),

('22000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000002', 'CAPA-2026-002-PA-03',
 'Add training compliance KPI to department head performance metrics. Monthly compliance report to Site Quality Head.',
 'PREVENTIVE', 'PENDING',
 'd0000000-0000-0000-0000-000000000003', '2026-07-31 23:59:00+05:30', NULL, NULL);

-- CAPA 3: INVESTIGATION - Self-identified equipment calibration program improvement
INSERT INTO capas (id, capa_number, title, description, type, status, priority, source_type, source_reference,
    initiated_date, target_completion_date, due_date,
    initiator_id, owner_id, department_id, plant_site_id,
    current_workflow_step,
    created_by, updated_by)
VALUES (
    '20000000-0000-0000-0000-000000000003', 'CAPA-2026-003',
    'Critical Equipment Calibration Program Enhancement',
    'Self-identified improvement opportunity: Review of CAPA-2026-001 revealed that the current calibration program for critical process equipment lacks robustness. Propose comprehensive review and enhancement of the calibration program across all manufacturing equipment to prevent similar incidents.',
    'PREVENTIVE', 'INVESTIGATION', 'MEDIUM', 'SELF_IDENTIFIED', 'CAPA-2026-001 (Related)',
    '2026-06-01 09:00:00+05:30', '2026-08-31 23:59:00+05:30', '2026-08-31 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000005', -- Anitha (CAPA coord) initiated
    'd0000000-0000-0000-0000-000000000008', -- Mohammad (engineering) owns
    'c0000000-0000-0000-0000-000000000004', -- Engineering dept
    'b0000000-0000-0000-0000-000000000001',
    'Investigation',
    'd0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000008'
);

-- ============================================================================
-- 13. CHANGE REQUESTS (2 sample change requests)
-- ============================================================================

-- Update sequence counter
UPDATE sequence_counters SET current_value = 2 WHERE sequence_name = 'CHANGE_CONTROL' AND year = 2026;

-- Change Request 1: APPROVED - Granulation parameters update
INSERT INTO change_requests (id, change_number, title, description, justification, type, category, classification, status, priority,
    requested_by_id, department_id, change_owner_id, qa_reviewer_id, ra_reviewer_id,
    plant_site_id, affected_areas,
    target_implementation_date, actual_implementation_date,
    regulatory_filing_required, validation_required, validation_details, training_required,
    related_deviations, related_capas,
    current_workflow_step,
    created_by, updated_by)
VALUES (
    '30000000-0000-0000-0000-000000000001', 'CC-2026-001',
    'Update Granulation Temperature Parameters for Metformin 500mg',
    'Revise the validated granulation temperature range from 55-65C to 50-60C for Metformin HCl 500mg tablets based on investigation findings from DEV-2026-001 and process optimization study. This change reduces the risk of temperature excursions while maintaining product quality attributes.',
    'DEV-2026-001 investigation revealed that the current temperature range (55-65C) operates too close to the thermal degradation threshold. Process development study PD-2026-008 demonstrated that granulation at 50-60C produces equivalent granule quality with improved process robustness. The lower range provides a 5C additional safety margin.',
    'PROCESS', 'PRODUCT', 'MAJOR', 'APPROVED', 'HIGH',
    'd0000000-0000-0000-0000-000000000008', -- Mohammad (engineering, requested)
    'c0000000-0000-0000-0000-000000000001', -- Production dept
    'd0000000-0000-0000-0000-000000000008', -- Mohammad (change owner)
    'd0000000-0000-0000-0000-000000000004', -- Suresh (QA reviewer)
    NULL,
    'b0000000-0000-0000-0000-000000000001',
    ARRAY['Granulation Suite GR-01', 'Granulation Suite GR-02', 'Granulation Suite GR-03'],
    '2026-06-30 23:59:00+05:30', NULL,
    FALSE, TRUE, 'Process validation protocol PV-2026-005 required for 3 consecutive batches at new parameters.', TRUE,
    ARRAY['DEV-2026-001'], ARRAY['CAPA-2026-001'],
    'Approved',
    'd0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003'
);

-- Change Request 1 Impact Assessment
INSERT INTO change_impact_assessments (change_request_id, product_quality, patient_safety,
    regulatory_compliance, validation_status, documentation, training,
    supplier_qualification, stability, overall_risk_level, assessment_summary,
    assessed_by_id) VALUES
('30000000-0000-0000-0000-000000000001', 'MEDIUM', 'LOW', 'MEDIUM', 'HIGH', 'HIGH', 'MEDIUM',
 'NO_IMPACT', 'LOW', 'MEDIUM',
 'Process change requires validation (3 batches). Product quality impact is medium as process parameters are changing. Patient safety impact is low - the product remains the same formulation. Regulatory impact medium as the change affects a validated process parameter. Stability data from development batches shows no adverse impact. Full documentation update and operator training required.',
 'd0000000-0000-0000-0000-000000000004');

-- Change Request 1 Affected Documents
INSERT INTO change_affected_documents (change_request_id, document_number, document_title, document_type, current_version, action, new_version, status) VALUES
('30000000-0000-0000-0000-000000000001', 'BMR-METF-500', 'Batch Manufacturing Record - Metformin HCl 500mg Tablets', 'Batch Record', 'Rev 05', 'REVISE', 'Rev 06', 'PENDING'),
('30000000-0000-0000-0000-000000000001', 'SOP-PROD-015', 'Temperature Monitoring During Granulation', 'SOP', 'Rev 03', 'REVISE', 'Rev 04', 'PENDING'),
('30000000-0000-0000-0000-000000000001', 'PV-METF-500', 'Process Validation Protocol - Metformin HCl 500mg', 'Validation Protocol', 'Rev 02', 'REVISE', 'Rev 03', 'PENDING');

-- Change Request 1 Affected Products
INSERT INTO change_affected_products (change_request_id, product_name, product_code, dosage_form, markets, impact_description) VALUES
('30000000-0000-0000-0000-000000000001', 'Metformin Hydrochloride Tablets IP 500mg', 'METF-500-TAB', 'Tablet',
 ARRAY['India', 'East Africa', 'Southeast Asia'],
 'Granulation temperature parameter change. Product formulation and specifications remain unchanged.');

-- Change Request 1 Implementation Tasks
INSERT INTO change_implementation_tasks (change_request_id, task_number, title, description, assigned_to_id, department_id, due_date, status) VALUES
('30000000-0000-0000-0000-000000000001', 1, 'Update BMR with new temperature parameters', 'Revise BMR-METF-500 to reflect new granulation temperature range 50-60C', 'd0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', '2026-06-25 23:59:00+05:30', 'NOT_STARTED'),
('30000000-0000-0000-0000-000000000001', 2, 'Execute process validation protocol', 'Manufacture 3 consecutive validation batches at new parameters', 'd0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', '2026-07-31 23:59:00+05:30', 'NOT_STARTED'),
('30000000-0000-0000-0000-000000000001', 3, 'Update PLC setpoints on granulators', 'Reprogram temperature setpoints on HSG-01, HSG-02, HSG-03', 'd0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', '2026-06-28 23:59:00+05:30', 'NOT_STARTED');

-- Change Request 1 Training Requirements
INSERT INTO change_training_requirements (change_request_id, training_title, target_audience, department_id, training_type, due_date) VALUES
('30000000-0000-0000-0000-000000000001', 'Revised Granulation Temperature Parameters - Metformin 500mg', 'Production Operators and Supervisors', 'c0000000-0000-0000-0000-000000000001', 'CLASSROOM', '2026-07-15 23:59:00+05:30'),
('30000000-0000-0000-0000-000000000001', 'Updated SOP-PROD-015 Read and Acknowledge', 'All Production Staff', 'c0000000-0000-0000-0000-000000000001', 'SOP_READ', '2026-07-15 23:59:00+05:30');

-- Change Request 1 Approvals
INSERT INTO change_approvals (change_request_id, approver_id, role, department, decision, comments, decision_date, approval_order) VALUES
('30000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'QA Reviewer', 'Quality Assurance', 'APPROVED',
 'Reviewed impact assessment and supporting data. Process development study PD-2026-008 provides adequate scientific justification. Validation protocol is appropriate.',
 '2026-06-15 14:00:00+05:30', 1),
('30000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Quality Manager', 'Quality Assurance', 'APPROVED',
 'Approved. The change improves process robustness and reduces excursion risk. Validation must be completed before commercial production.',
 '2026-06-16 10:30:00+05:30', 2),
('30000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Site Quality Head', 'Quality Assurance', 'APPROVED',
 'Final approval granted. Ensure all training is completed before first commercial batch at new parameters.',
 '2026-06-17 11:00:00+05:30', 3);

-- Change Request 2: IMPACT_ASSESSMENT - Equipment replacement
INSERT INTO change_requests (id, change_number, title, description, justification, type, category, classification, status, priority,
    requested_by_id, department_id, change_owner_id, qa_reviewer_id,
    plant_site_id, affected_areas,
    target_implementation_date,
    regulatory_filing_required, validation_required, training_required,
    current_workflow_step,
    created_by, updated_by)
VALUES (
    '30000000-0000-0000-0000-000000000002', 'CC-2026-002',
    'Replacement of Tablet Press Cadmach CTX-45 with CTX-55D',
    'Replace the existing Cadmach CTX-45 tablet press in Compression Suite CP-01 with a new Cadmach CTX-55D model. The CTX-45 has reached end of operational life with increasing frequency of compression force variations (ref: DEV-2026-002). The CTX-55D provides improved force control, higher output, and built-in PAT capabilities.',
    'The CTX-45 tablet press (installed 2018) has shown increasing reliability issues over the past 12 months: 3 unplanned deviations, 5 unscheduled maintenance events, and 120 hours of production downtime. The new CTX-55D model offers improved compression force control (+/-2% vs +/-5%), higher output (150K/hr vs 100K/hr), and integrated PAT sensors for real-time monitoring.',
    'EQUIPMENT', 'PRODUCT', 'CRITICAL', 'IMPACT_ASSESSMENT', 'HIGH',
    'd0000000-0000-0000-0000-000000000008', -- Mohammad (engineering)
    'c0000000-0000-0000-0000-000000000004', -- Engineering dept
    'd0000000-0000-0000-0000-000000000008', -- Mohammad (change owner)
    'd0000000-0000-0000-0000-000000000004', -- Suresh (QA reviewer)
    'b0000000-0000-0000-0000-000000000001',
    ARRAY['Compression Suite CP-01', 'QC Testing Lab'],
    '2026-09-30 23:59:00+05:30',
    FALSE, TRUE, TRUE,
    'Impact Assessment',
    'd0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000008'
);

-- ============================================================================
-- 14. WORKFLOW HISTORY (sample entries)
-- ============================================================================

-- Deviation 1 workflow history (completed)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Reported', 'COMPLETED', 'd0000000-0000-0000-0000-000000000007', '2026-04-05 11:00:00+05:30', '2026-04-05 14:00:00+05:30', 'Deviation reported by production operator', 1),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Under Review', 'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-04-05 14:00:00+05:30', '2026-04-06 09:00:00+05:30', 'Reviewed and classified as Major', 2),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Investigation', 'COMPLETED', 'd0000000-0000-0000-0000-000000000006', '2026-04-06 09:00:00+05:30', '2026-04-15 17:00:00+05:30', 'Investigation completed - root cause identified', 3),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Impact Assessment', 'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-04-16 09:00:00+05:30', '2026-04-18 15:00:00+05:30', 'Impact assessed as Medium risk', 4),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Disposition', 'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-04-18 15:00:00+05:30', '2026-04-20 10:00:00+05:30', 'Release with conditions approved', 5),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'CAPA Initiated', 'COMPLETED', 'd0000000-0000-0000-0000-000000000005', '2026-04-20 10:00:00+05:30', '2026-04-22 09:00:00+05:30', 'CAPA-2026-001 created', 6),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Closed', 'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-04-28 14:00:00+05:30', '2026-04-28 16:00:00+05:30', 'Deviation closed after CAPA initiation', 7);

-- Deviation 2 workflow history (in progress)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Reported', 'COMPLETED', 'd0000000-0000-0000-0000-000000000007', '2026-06-10 14:45:00+05:30', '2026-06-10 16:00:00+05:30', 'Deviation reported', 1),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Under Review', 'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-06-10 16:00:00+05:30', '2026-06-11 09:00:00+05:30', 'Classified as Major - Equipment deviation', 2),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Investigation', 'CURRENT', 'd0000000-0000-0000-0000-000000000006', '2026-06-11 09:00:00+05:30', NULL, 'Investigation in progress - fishbone analysis', 3);

-- CAPA 1 workflow history (completed)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('CAPA', '20000000-0000-0000-0000-000000000001', 'Initiation', 'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-04-16 09:00:00+05:30', '2026-04-16 14:00:00+05:30', 'CAPA initiated from DEV-2026-001', 1),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Investigation', 'COMPLETED', 'd0000000-0000-0000-0000-000000000006', '2026-04-16 14:00:00+05:30', '2026-04-20 15:00:00+05:30', 'Root cause analysis completed', 2),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Action Planning', 'COMPLETED', 'd0000000-0000-0000-0000-000000000005', '2026-04-20 15:00:00+05:30', '2026-04-22 17:00:00+05:30', '4 actions defined (2 corrective, 2 preventive)', 3),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Action Execution', 'COMPLETED', 'd0000000-0000-0000-0000-000000000005', '2026-04-22 17:00:00+05:30', '2026-05-22 12:00:00+05:30', 'All 4 actions completed and verified', 4),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Effectiveness Check', 'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-05-22 12:00:00+05:30', '2026-05-25 10:00:00+05:30', 'Effectiveness verified - all criteria met', 5),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Closed', 'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-05-25 10:00:00+05:30', '2026-05-28 10:00:00+05:30', 'CAPA closed after effectiveness verification', 6);

-- Change Request 1 workflow history
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Draft', 'COMPLETED', 'd0000000-0000-0000-0000-000000000008', '2026-06-01 09:00:00+05:30', '2026-06-05 17:00:00+05:30', 'Change request drafted', 1),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Impact Assessment', 'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-06-05 17:00:00+05:30', '2026-06-10 14:00:00+05:30', 'Impact assessment completed', 2),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'QA Review', 'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-06-10 14:00:00+05:30', '2026-06-15 14:00:00+05:30', 'QA review completed - approved', 3),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Pending Approval', 'COMPLETED', 'd0000000-0000-0000-0000-000000000002', '2026-06-15 14:00:00+05:30', '2026-06-17 11:00:00+05:30', 'All 3 approvals obtained', 4),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Implementation', 'CURRENT', 'd0000000-0000-0000-0000-000000000008', '2026-06-17 11:00:00+05:30', NULL, 'Implementation tasks in progress', 5);

-- ============================================================================
-- 15. AUDIT TRAIL ENTRIES (sample entries for compliance)
-- ============================================================================

INSERT INTO audit_trail (record_type, record_id, record_number, action, field_name, old_value, new_value,
    comments, user_id, user_name, ip_address, timestamp) VALUES

('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'CREATED', NULL, NULL, NULL,
 'Deviation created - Temperature excursion during granulation', 'd0000000-0000-0000-0000-000000000007', 'Venkat Naidu', '192.168.1.101', '2026-04-05 11:00:00+05:30'),

('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'STATUS_CHANGE', 'status', 'REPORTED', 'UNDER_REVIEW',
 'Deviation assigned for review', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '192.168.1.102', '2026-04-05 14:00:00+05:30'),

('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'CLASSIFIED', 'classification', NULL, 'MAJOR',
 'Classified as Major - GMP impact confirmed', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '192.168.1.102', '2026-04-05 14:15:00+05:30'),

('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'STATUS_CHANGE', 'status', 'UNDER_REVIEW', 'INVESTIGATION',
 'Investigation started by Lakshmi Devi', 'd0000000-0000-0000-0000-000000000006', 'Lakshmi Devi', '192.168.1.103', '2026-04-06 09:00:00+05:30'),

('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'STATUS_CHANGE', 'status', 'INVESTIGATION', 'CLOSED',
 'Deviation closed - CAPA initiated', 'd0000000-0000-0000-0000-000000000003', 'Priya Sharma', '192.168.1.104', '2026-04-28 16:00:00+05:30'),

('CAPA', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001', 'CREATED', NULL, NULL, NULL,
 'CAPA initiated from DEV-2026-001', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '192.168.1.102', '2026-04-16 09:00:00+05:30'),

('CAPA', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001', 'STATUS_CHANGE', 'status', 'INITIATED', 'CLOSED',
 'CAPA closed - effectiveness verified', 'd0000000-0000-0000-0000-000000000003', 'Priya Sharma', '192.168.1.104', '2026-05-28 10:00:00+05:30'),

('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'CC-2026-001', 'CREATED', NULL, NULL, NULL,
 'Change request created for granulation temperature update', 'd0000000-0000-0000-0000-000000000008', 'Mohammad Ali', '192.168.1.105', '2026-06-01 09:00:00+05:30'),

('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'CC-2026-001', 'STATUS_CHANGE', 'status', 'PENDING_APPROVAL', 'APPROVED',
 'Change request approved by Site Quality Head', 'd0000000-0000-0000-0000-000000000002', 'Srinivas Rao', '192.168.1.106', '2026-06-17 11:00:00+05:30'),

('USER', 'd0000000-0000-0000-0000-000000000001', 'EMP-001', 'CREATED', NULL, NULL, NULL,
 'System administrator account created', 'd0000000-0000-0000-0000-000000000001', 'Rajesh Kumar', '192.168.1.100', '2026-01-01 09:00:00+05:30');

-- ============================================================================
-- 16. NOTIFICATIONS (sample notifications for different users)
-- ============================================================================

INSERT INTO notifications (user_id, title, message, notification_type, record_type, record_id, record_number, is_read, priority) VALUES

-- Notifications for Lakshmi (Investigator) - investigation assigned
('d0000000-0000-0000-0000-000000000006', 'Investigation Assigned: DEV-2026-002',
 'You have been assigned to investigate deviation DEV-2026-002: Tablet Press Compression Force Variation. Due date: 2026-07-10.',
 'TASK_ASSIGNED', 'DEVIATION', '10000000-0000-0000-0000-000000000002', 'DEV-2026-002', FALSE, 'HIGH'),

-- Notifications for Suresh (QA Reviewer) - review pending
('d0000000-0000-0000-0000-000000000004', 'Review Required: DEV-2026-003',
 'New deviation DEV-2026-003 (Raw Material COA Discrepancy) requires your review and classification.',
 'APPROVAL_REQUIRED', 'DEVIATION', '10000000-0000-0000-0000-000000000003', 'DEV-2026-003', FALSE, 'NORMAL'),

-- Notifications for Ravi (Training Admin) - CAPA action overdue warning
('d0000000-0000-0000-0000-000000000010', 'Action Update: CAPA-2026-002-PA-01',
 'CAPA action CAPA-2026-002-PA-01 (Automated SOP training system) is due on 2026-07-15. Current status: In Progress.',
 'REMINDER', 'CAPA', '20000000-0000-0000-0000-000000000002', 'CAPA-2026-002', FALSE, 'NORMAL'),

-- Notifications for Mohammad (Change Owner) - implementation tasks
('d0000000-0000-0000-0000-000000000008', 'Implementation Started: CC-2026-001',
 'Change request CC-2026-001 has been approved. 3 implementation tasks are ready to start. Target completion: 2026-07-31.',
 'STATUS_CHANGE', 'CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'CC-2026-001', TRUE, 'HIGH'),

-- Notifications for Priya (Quality Manager) - dashboard KPI alert
('d0000000-0000-0000-0000-000000000003', 'Monthly Quality Metrics Alert',
 'June 2026 quality metrics: 3 open deviations, 2 open CAPAs, 1 active change control. 1 CAPA action approaching due date.',
 'SYSTEM', NULL, NULL, NULL, FALSE, 'NORMAL'),

-- Notifications for Venkat (Operator) - deviation update
('d0000000-0000-0000-0000-000000000007', 'Deviation Update: DEV-2026-002',
 'Investigation has started for deviation DEV-2026-002 that you reported. Investigator: Lakshmi Devi.',
 'STATUS_CHANGE', 'DEVIATION', '10000000-0000-0000-0000-000000000002', 'DEV-2026-002', TRUE, 'NORMAL');

-- ============================================================================
-- 17. RECORD COMMENTS (sample comments)
-- ============================================================================

INSERT INTO record_comments (record_type, record_id, comment_text, comment_type, user_id, is_internal) VALUES
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Temperature excursion confirmed by reviewing the electronic batch record data logger output. Peak temperature 72C sustained for approximately 15 minutes.', 'INVESTIGATION', 'd0000000-0000-0000-0000-000000000006', FALSE),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Granule moisture content and LOD results are within specification despite the excursion. Recommend proceeding with batch processing under additional testing conditions.', 'REVIEW', 'd0000000-0000-0000-0000-000000000004', FALSE),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Approved release with conditions. Internal note: Monitor similar equipment across other suites.', 'APPROVAL', 'd0000000-0000-0000-0000-000000000003', TRUE),
('CAPA', '20000000-0000-0000-0000-000000000002', 'Production has agreed to release 2 operators per shift for training sessions. Schedule finalized with shift supervisors.', 'GENERAL', 'd0000000-0000-0000-0000-000000000010', FALSE),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Process development study PD-2026-008 data reviewed. The dissolution profiles at 50-60C granulation temperature are equivalent to current 55-65C range. F2 similarity factor > 50 for all dissolution media.', 'REVIEW', 'd0000000-0000-0000-0000-000000000004', FALSE);

-- ============================================================================
-- 18. SYSTEM CONFIGURATIONS
-- ============================================================================

INSERT INTO system_configurations (config_key, config_value, config_type, module, description) VALUES
('password.min.length', '8', 'INTEGER', 'ADMIN', 'Minimum password length'),
('password.max.age.days', '90', 'INTEGER', 'ADMIN', 'Password expiration in days'),
('password.history.count', '5', 'INTEGER', 'ADMIN', 'Number of previous passwords to remember'),
('login.max.failed.attempts', '5', 'INTEGER', 'ADMIN', 'Maximum failed login attempts before lockout'),
('login.lockout.duration.minutes', '30', 'INTEGER', 'ADMIN', 'Account lockout duration in minutes'),
('session.timeout.minutes', '30', 'INTEGER', 'ADMIN', 'Session inactivity timeout'),
('deviation.default.closure.days', '30', 'INTEGER', 'DEVIATION', 'Default days for deviation closure target'),
('capa.default.closure.days', '90', 'INTEGER', 'CAPA', 'Default days for CAPA closure target'),
('capa.effectiveness.check.months', '3', 'INTEGER', 'CAPA', 'Default months for effectiveness check recurrence'),
('change.control.default.closure.days', '120', 'INTEGER', 'CHANGE_CONTROL', 'Default days for change control closure'),
('notification.email.enabled', 'true', 'BOOLEAN', 'ADMIN', 'Enable email notifications'),
('notification.reminder.days', '7,3,1', 'STRING', 'ADMIN', 'Days before due date to send reminder notifications'),
('audit.trail.retention.years', '15', 'INTEGER', 'ADMIN', 'Audit trail data retention period in years'),
('esignature.require.reason', 'true', 'BOOLEAN', 'ADMIN', 'Require reason/meaning for electronic signatures'),
('report.company.name', 'Mechatron Pharma Pvt Ltd', 'STRING', 'REPORT', 'Company name displayed on reports'),
('report.company.logo.url', '/assets/images/mechatron-logo.png', 'STRING', 'REPORT', 'Company logo URL for reports');

-- ============================================================================
-- 19. LOGIN AUDIT ENTRIES (sample successful logins)
-- ============================================================================

INSERT INTO user_login_audit (user_id, username, login_timestamp, ip_address, user_agent, login_status) VALUES
('d0000000-0000-0000-0000-000000000001', 'rajesh.kumar', '2026-06-21 08:30:00+05:30', '192.168.1.100', 'Mozilla/5.0 Chrome/126.0', 'SUCCESS'),
('d0000000-0000-0000-0000-000000000003', 'priya.sharma', '2026-06-21 08:45:00+05:30', '192.168.1.104', 'Mozilla/5.0 Chrome/126.0', 'SUCCESS'),
('d0000000-0000-0000-0000-000000000007', 'venkat.naidu', '2026-06-21 06:00:00+05:30', '192.168.1.101', 'Mozilla/5.0 Chrome/126.0', 'SUCCESS'),
('d0000000-0000-0000-0000-000000000004', 'suresh.reddy', '2026-06-21 09:00:00+05:30', '192.168.1.102', 'Mozilla/5.0 Chrome/126.0', 'SUCCESS'),
('d0000000-0000-0000-0000-000000000008', 'mohammad.ali', '2026-06-21 08:15:00+05:30', '192.168.1.105', 'Mozilla/5.0 Chrome/126.0', 'SUCCESS'),
('d0000000-0000-0000-0000-000000000012', 'ramesh.gupta', '2026-06-20 14:00:00+05:30', '192.168.1.107', 'Mozilla/5.0 Chrome/126.0', 'SUCCESS'),
('d0000000-0000-0000-0000-000000000012', 'ramesh.gupta', '2026-06-20 14:05:00+05:30', '192.168.1.107', 'Mozilla/5.0 Chrome/126.0', 'FAILED');