-- ============================================================================
-- V9: UAT Workflow Test Data (UPSERT version)
-- Comprehensive sample data for all workflow stages, audit trail, e-signatures,
-- workflow_history, linked records (Deviation -> CAPA -> Change Control)
-- All INSERT statements use ON CONFLICT for idempotent re-runs.
-- ============================================================================
-- All test user passwords: Password@123
-- BCrypt hash: $2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADDITIONAL TEST USERS (Phase 2+ roles for UAT coverage)
-- ============================================================================

INSERT INTO users (id, employee_id, username, email, first_name, last_name, password_hash, phone, job_title, user_type, organization_id, plant_site_id, department_id, manager_id, is_active, must_change_password) VALUES

-- 13. Regulatory Affairs
('d0000000-0000-0000-0000-000000000013', 'EMP-013', 'neha.joshi', 'neha.joshi@mechatronpharma.com',
 'Neha', 'Joshi', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543013', 'Regulatory Affairs Manager', 'REGULATORY_AFFAIRS',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', TRUE, FALSE),

-- 14. Supplier Quality Manager
('d0000000-0000-0000-0000-000000000014', 'EMP-014', 'arun.patel', 'arun.patel@mechatronpharma.com',
 'Arun', 'Patel', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543014', 'Supplier Quality Manager', 'SUPPLIER_QUALITY_MANAGER',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', TRUE, FALSE),

-- 15. Complaint Handler
('d0000000-0000-0000-0000-000000000015', 'EMP-015', 'meera.iyer', 'meera.iyer@mechatronpharma.com',
 'Meera', 'Iyer', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543015', 'Customer Complaint Handler', 'COMPLAINT_HANDLER',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', TRUE, FALSE),

-- 16. Validation Engineer
('d0000000-0000-0000-0000-000000000016', 'EMP-016', 'vikram.singh', 'vikram.singh@mechatronpharma.com',
 'Vikram', 'Singh', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543016', 'Validation Engineer', 'VALIDATION_ENGINEER',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000008', TRUE, FALSE),

-- 17. Maintenance User
('d0000000-0000-0000-0000-000000000017', 'EMP-017', 'sunil.verma', 'sunil.verma@mechatronpharma.com',
 'Sunil', 'Verma', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543017', 'Maintenance Technician', 'MAINTENANCE_USER',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000008', TRUE, FALSE),

-- 18. Executive / VP Quality
('d0000000-0000-0000-0000-000000000018', 'EMP-018', 'sunita.desai', 'sunita.desai@mechatronpharma.com',
 'Sunita', 'Desai', '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK',
 '+91-9876543018', 'VP Quality & Compliance', 'EXECUTIVE',
 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'c0000000-0000-0000-0000-000000000002', NULL, TRUE, FALSE)

ON CONFLICT (id) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    password_hash = EXCLUDED.password_hash,
    phone = EXCLUDED.phone,
    job_title = EXCLUDED.job_title,
    user_type = EXCLUDED.user_type,
    organization_id = EXCLUDED.organization_id,
    plant_site_id = EXCLUDED.plant_site_id,
    department_id = EXCLUDED.department_id,
    manager_id = EXCLUDED.manager_id,
    is_active = EXCLUDED.is_active,
    must_change_password = EXCLUDED.must_change_password;

-- ============================================================================
-- 2. ROLE ASSIGNMENTS FOR NEW USERS
-- ============================================================================

-- Neha Joshi (Regulatory Affairs) -> REVIEWER + END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000013', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('REVIEWER', 'END_USER')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = 'd0000000-0000-0000-0000-000000000013' AND ur.role_id = ar.id);

-- Arun Patel (Supplier Quality) -> QA_REVIEWER + OWNER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000014', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('QA_REVIEWER', 'OWNER')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = 'd0000000-0000-0000-0000-000000000014' AND ur.role_id = ar.id);

-- Meera Iyer (Complaint Handler) -> OWNER + END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000015', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('OWNER', 'END_USER')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = 'd0000000-0000-0000-0000-000000000015' AND ur.role_id = ar.id);

-- Vikram Singh (Validation Engineer) -> REVIEWER + END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000016', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('REVIEWER', 'END_USER')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = 'd0000000-0000-0000-0000-000000000016' AND ur.role_id = ar.id);

-- Sunil Verma (Maintenance) -> END_USER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000017', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code = 'END_USER'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = 'd0000000-0000-0000-0000-000000000017' AND ur.role_id = ar.id);

-- Sunita Desai (Executive) -> EXECUTIVE + QA_APPROVER
INSERT INTO user_roles (user_id, role_id, plant_site_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000018', ar.id, 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
FROM application_roles ar WHERE ar.code IN ('EXECUTIVE', 'QA_APPROVER')
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = 'd0000000-0000-0000-0000-000000000018' AND ur.role_id = ar.id);

-- ============================================================================
-- 3. SECURITY PROFILE ASSIGNMENTS FOR NEW USERS
-- ============================================================================

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000013', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Quality Manager Profile'
AND NOT EXISTS (SELECT 1 FROM user_security_profiles usp WHERE usp.user_id = 'd0000000-0000-0000-0000-000000000013' AND usp.security_profile_id = sp.id);

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000014', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'QA Specialist Profile'
AND NOT EXISTS (SELECT 1 FROM user_security_profiles usp WHERE usp.user_id = 'd0000000-0000-0000-0000-000000000014' AND usp.security_profile_id = sp.id);

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000015', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'CAPA Coordinator Profile'
AND NOT EXISTS (SELECT 1 FROM user_security_profiles usp WHERE usp.user_id = 'd0000000-0000-0000-0000-000000000015' AND usp.security_profile_id = sp.id);

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000016', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Change Owner Profile'
AND NOT EXISTS (SELECT 1 FROM user_security_profiles usp WHERE usp.user_id = 'd0000000-0000-0000-0000-000000000016' AND usp.security_profile_id = sp.id);

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000017', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Operator Profile'
AND NOT EXISTS (SELECT 1 FROM user_security_profiles usp WHERE usp.user_id = 'd0000000-0000-0000-0000-000000000017' AND usp.security_profile_id = sp.id);

INSERT INTO user_security_profiles (user_id, security_profile_id, assigned_by)
SELECT 'd0000000-0000-0000-0000-000000000018', sp.id, 'd0000000-0000-0000-0000-000000000001'
FROM security_profiles sp WHERE sp.name = 'Site Quality Head Profile'
AND NOT EXISTS (SELECT 1 FROM user_security_profiles usp WHERE usp.user_id = 'd0000000-0000-0000-0000-000000000018' AND usp.security_profile_id = sp.id);


-- ============================================================================
-- 4. UPDATE SEQUENCE COUNTERS (upsert)
-- ============================================================================

INSERT INTO sequence_counters (sequence_name, plant_site_id, year, current_value, prefix, format_pattern)
VALUES
  ('DEVIATION', 'b0000000-0000-0000-0000-000000000001', 2026, 8, 'DEV', '{PREFIX}-{YEAR}-{SEQ:3}'),
  ('CAPA', 'b0000000-0000-0000-0000-000000000001', 2026, 5, 'CAPA', '{PREFIX}-{YEAR}-{SEQ:3}'),
  ('CHANGE_CONTROL', 'b0000000-0000-0000-0000-000000000001', 2026, 4, 'CC', '{PREFIX}-{YEAR}-{SEQ:3}')
ON CONFLICT (sequence_name, plant_site_id, year) DO UPDATE SET
  current_value = GREATEST(sequence_counters.current_value, EXCLUDED.current_value);


-- ============================================================================
-- 5. ADDITIONAL DEVIATIONS (at various workflow stages for UAT)
-- ============================================================================

-- DEV-2026-004: UNDER_REVIEW (QA triage pending)
INSERT INTO deviations (id, deviation_number, title, description, type, category, classification, status,
    source_area, occurred_date, reported_date, detected_date, target_closure_date,
    reported_by_id,
    plant_site_id, department_id, area, equipment,
    product, batch_number, batch_size,
    gmp_impact, patient_safety_impact, regulatory_impact,
    capa_required, current_workflow_step,
    created_by, updated_by)
VALUES (
    '10000000-0000-0000-0000-000000000004', 'DEV-2026-004',
    'Water System TOC Excursion - Purified Water Loop 2',
    'During routine monitoring of Purified Water Loop 2, the Total Organic Carbon (TOC) level was found to be 520 ppb, exceeding the alert limit of 400 ppb and approaching the action limit of 500 ppb. The excursion was detected during the 06:00 AM sampling round. The purified water system was sanitized last week per schedule.',
    'UNPLANNED', 'UTILITY', NULL, 'UNDER_REVIEW',
    'Utility Room - Water Generation Area',
    '2026-06-20 06:30:00+05:30', '2026-06-20 07:00:00+05:30', '2026-06-20 06:45:00+05:30',
    '2026-07-20 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000012',
    'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',
    'Water Generation Room WG-01', 'Purified Water System PW-02',
    NULL, NULL, NULL,
    TRUE, FALSE, FALSE,
    FALSE, 'Under Review',
    'd0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000012'
)
ON CONFLICT (deviation_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, type = EXCLUDED.type,
    category = EXCLUDED.category, classification = EXCLUDED.classification, status = EXCLUDED.status,
    source_area = EXCLUDED.source_area, occurred_date = EXCLUDED.occurred_date,
    reported_date = EXCLUDED.reported_date, detected_date = EXCLUDED.detected_date,
    target_closure_date = EXCLUDED.target_closure_date, reported_by_id = EXCLUDED.reported_by_id,
    plant_site_id = EXCLUDED.plant_site_id, department_id = EXCLUDED.department_id,
    area = EXCLUDED.area, equipment = EXCLUDED.equipment,
    product = EXCLUDED.product, batch_number = EXCLUDED.batch_number, batch_size = EXCLUDED.batch_size,
    gmp_impact = EXCLUDED.gmp_impact, patient_safety_impact = EXCLUDED.patient_safety_impact,
    regulatory_impact = EXCLUDED.regulatory_impact, capa_required = EXCLUDED.capa_required,
    current_workflow_step = EXCLUDED.current_workflow_step,
    updated_by = EXCLUDED.updated_by;

-- DEV-2026-005: CLASSIFIED (classified, pending investigation assignment)
INSERT INTO deviations (id, deviation_number, title, description, type, category, classification, status,
    source_area, occurred_date, reported_date, detected_date, target_closure_date,
    reported_by_id, reviewer_id,
    plant_site_id, department_id, area, equipment, product, batch_number, batch_size,
    gmp_impact, patient_safety_impact, regulatory_impact,
    capa_required, current_workflow_step,
    created_by, updated_by)
VALUES (
    '10000000-0000-0000-0000-000000000005', 'DEV-2026-005',
    'Missing Batch Record Entry - Omeprazole Capsule Filling',
    'During batch record review of OMEP-2026-001, it was found that the capsule fill weight check at 14:00 hrs was not recorded in the batch manufacturing record. The operator confirmed the check was performed but forgot to document the result. The capsule fill weights from the retained samples were verified and found within specification.',
    'UNPLANNED', 'DOCUMENTATION', 'MINOR', 'CLASSIFIED',
    'Capsule Filling Suite CF-01',
    '2026-06-15 16:00:00+05:30', '2026-06-15 16:30:00+05:30', '2026-06-15 16:15:00+05:30',
    '2026-07-15 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000007',
    'd0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
    'Capsule Filling Suite CF-01', 'Bosch GKF-2500 Capsule Filler',
    'Omeprazole Capsules IP 20mg', 'OMEP-2026-001', NULL,
    TRUE, FALSE, FALSE,
    FALSE, 'Classified',
    'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004'
)
ON CONFLICT (deviation_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, type = EXCLUDED.type,
    category = EXCLUDED.category, classification = EXCLUDED.classification, status = EXCLUDED.status,
    source_area = EXCLUDED.source_area, occurred_date = EXCLUDED.occurred_date,
    reported_date = EXCLUDED.reported_date, detected_date = EXCLUDED.detected_date,
    target_closure_date = EXCLUDED.target_closure_date, reported_by_id = EXCLUDED.reported_by_id,
    reviewer_id = EXCLUDED.reviewer_id,
    plant_site_id = EXCLUDED.plant_site_id, department_id = EXCLUDED.department_id,
    area = EXCLUDED.area, equipment = EXCLUDED.equipment,
    product = EXCLUDED.product, batch_number = EXCLUDED.batch_number, batch_size = EXCLUDED.batch_size,
    gmp_impact = EXCLUDED.gmp_impact, patient_safety_impact = EXCLUDED.patient_safety_impact,
    regulatory_impact = EXCLUDED.regulatory_impact, capa_required = EXCLUDED.capa_required,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;

-- DEV-2026-006: IMPACT_ASSESSMENT
INSERT INTO deviations (id, deviation_number, title, description, type, category, classification, status,
    source_area, occurred_date, reported_date, detected_date, target_closure_date,
    reported_by_id, assigned_to_id, reviewer_id,
    plant_site_id, department_id, area, equipment, product, batch_number, batch_size,
    gmp_impact, patient_safety_impact, regulatory_impact,
    capa_required, current_workflow_step,
    created_by, updated_by)
VALUES (
    '10000000-0000-0000-0000-000000000006', 'DEV-2026-006',
    'Environmental Monitoring Excursion - Sterile Corridor Grade B',
    'Settle plate count in Grade B sterile corridor (Room SC-03) showed 8 CFU during routine EM monitoring. The action limit is 5 CFU for Grade B areas. Adjacent rooms showed normal counts. Investigation into root cause is required.',
    'UNPLANNED', 'ENVIRONMENTAL', 'MAJOR', 'IMPACT_ASSESSMENT',
    'Sterile Corridor SC-03',
    '2026-06-12 10:00:00+05:30', '2026-06-12 10:30:00+05:30', '2026-06-12 10:15:00+05:30',
    '2026-07-12 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000007',
    'd0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
    'Sterile Corridor SC-03', NULL,
    NULL, NULL, NULL,
    TRUE, FALSE, FALSE,
    TRUE, 'Impact Assessment',
    'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000006'
)
ON CONFLICT (deviation_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, type = EXCLUDED.type,
    category = EXCLUDED.category, classification = EXCLUDED.classification, status = EXCLUDED.status,
    source_area = EXCLUDED.source_area, occurred_date = EXCLUDED.occurred_date,
    reported_date = EXCLUDED.reported_date, detected_date = EXCLUDED.detected_date,
    target_closure_date = EXCLUDED.target_closure_date, reported_by_id = EXCLUDED.reported_by_id,
    assigned_to_id = EXCLUDED.assigned_to_id, reviewer_id = EXCLUDED.reviewer_id,
    plant_site_id = EXCLUDED.plant_site_id, department_id = EXCLUDED.department_id,
    area = EXCLUDED.area, equipment = EXCLUDED.equipment,
    product = EXCLUDED.product, batch_number = EXCLUDED.batch_number, batch_size = EXCLUDED.batch_size,
    gmp_impact = EXCLUDED.gmp_impact, patient_safety_impact = EXCLUDED.patient_safety_impact,
    regulatory_impact = EXCLUDED.regulatory_impact, capa_required = EXCLUDED.capa_required,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;

-- DEV-2026-007: DISPOSITION (pending disposition approval)
INSERT INTO deviations (id, deviation_number, title, description, type, category, classification, status,
    source_area, occurred_date, reported_date, detected_date, target_closure_date,
    reported_by_id, assigned_to_id, reviewer_id,
    plant_site_id, department_id, area, equipment, product, batch_number, batch_size,
    gmp_impact, patient_safety_impact, regulatory_impact,
    capa_required, current_workflow_step,
    created_by, updated_by)
VALUES (
    '10000000-0000-0000-0000-000000000007', 'DEV-2026-007',
    'Label Mix-up Detected During Packaging - Amoxicillin 500mg',
    'During secondary packaging of batch AMOX-2026-002, an incorrect product label (Cetirizine 10mg) was found in the label feeding station. The operator detected the error before any incorrect labels were applied. Line clearance procedure was reviewed. 200 packs from the suspect time window were quarantined for 100% visual inspection.',
    'UNPLANNED', 'PACKAGING', 'CRITICAL', 'DISPOSITION',
    'Packaging Line PL-02',
    '2026-06-08 11:00:00+05:30', '2026-06-08 11:15:00+05:30', '2026-06-08 11:05:00+05:30',
    '2026-07-08 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000007',
    'd0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
    'Packaging Line PL-02', 'Uhlmann Blister Line BL-02',
    'Amoxicillin Capsules IP 500mg', 'AMOX-2026-002', '500000 Capsules',
    TRUE, TRUE, TRUE,
    TRUE, 'Disposition',
    'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004'
)
ON CONFLICT (deviation_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, type = EXCLUDED.type,
    category = EXCLUDED.category, classification = EXCLUDED.classification, status = EXCLUDED.status,
    source_area = EXCLUDED.source_area, occurred_date = EXCLUDED.occurred_date,
    reported_date = EXCLUDED.reported_date, detected_date = EXCLUDED.detected_date,
    target_closure_date = EXCLUDED.target_closure_date, reported_by_id = EXCLUDED.reported_by_id,
    assigned_to_id = EXCLUDED.assigned_to_id, reviewer_id = EXCLUDED.reviewer_id,
    plant_site_id = EXCLUDED.plant_site_id, department_id = EXCLUDED.department_id,
    area = EXCLUDED.area, equipment = EXCLUDED.equipment,
    product = EXCLUDED.product, batch_number = EXCLUDED.batch_number, batch_size = EXCLUDED.batch_size,
    gmp_impact = EXCLUDED.gmp_impact, patient_safety_impact = EXCLUDED.patient_safety_impact,
    regulatory_impact = EXCLUDED.regulatory_impact, capa_required = EXCLUDED.capa_required,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;

-- DEV-2026-008: PENDING_CLOSURE
INSERT INTO deviations (id, deviation_number, title, description, type, category, classification, status,
    source_area, occurred_date, reported_date, detected_date, target_closure_date,
    reported_by_id, assigned_to_id, reviewer_id, approved_by_id,
    plant_site_id, department_id, area, equipment, product, batch_number, batch_size,
    gmp_impact, patient_safety_impact, regulatory_impact,
    capa_required, current_workflow_step,
    created_by, updated_by)
VALUES (
    '10000000-0000-0000-0000-000000000008', 'DEV-2026-008',
    'SOP Training Gap - New Cleaning Procedure Not Trained',
    'During internal audit, it was found that 3 operators in Production department were not trained on the revised cleaning SOP (SOP-CLN-012 Rev 03). The SOP was effective since May 15, 2026 but training was completed only for 7 out of 10 applicable operators.',
    'UNPLANNED', 'PERSONNEL', 'MINOR', 'PENDING_CLOSURE',
    'Production Floor',
    '2026-06-05 14:00:00+05:30', '2026-06-05 14:30:00+05:30', '2026-06-05 14:15:00+05:30',
    '2026-07-05 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000011',
    'd0000000-0000-0000-0000-000000000010',
    'd0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
    'Production Floor - All Areas', NULL, NULL, NULL, NULL,
    TRUE, FALSE, FALSE,
    FALSE, 'Pending Closure',
    'd0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (deviation_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, type = EXCLUDED.type,
    category = EXCLUDED.category, classification = EXCLUDED.classification, status = EXCLUDED.status,
    source_area = EXCLUDED.source_area, occurred_date = EXCLUDED.occurred_date,
    reported_date = EXCLUDED.reported_date, detected_date = EXCLUDED.detected_date,
    target_closure_date = EXCLUDED.target_closure_date, reported_by_id = EXCLUDED.reported_by_id,
    assigned_to_id = EXCLUDED.assigned_to_id, reviewer_id = EXCLUDED.reviewer_id,
    approved_by_id = EXCLUDED.approved_by_id,
    plant_site_id = EXCLUDED.plant_site_id, department_id = EXCLUDED.department_id,
    area = EXCLUDED.area, equipment = EXCLUDED.equipment,
    product = EXCLUDED.product, batch_number = EXCLUDED.batch_number, batch_size = EXCLUDED.batch_size,
    gmp_impact = EXCLUDED.gmp_impact, patient_safety_impact = EXCLUDED.patient_safety_impact,
    regulatory_impact = EXCLUDED.regulatory_impact, capa_required = EXCLUDED.capa_required,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;


-- ============================================================================
-- 6. CAPA RECORDS (at various workflow stages)
-- ============================================================================

-- CAPA-2026-001: CLOSED (linked to DEV-2026-001 temperature excursion)
INSERT INTO capas (id, capa_number, title, description, type, status, priority, source_type, source_reference,
    initiated_date, target_completion_date, actual_completion_date, due_date,
    initiator_id, owner_id, department_id, plant_site_id,
    product, batch_number, deviation_id,
    current_workflow_step, created_by, updated_by, closed_at)
VALUES (
    '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001',
    'Preventive Actions for Temperature Monitoring System - HSG-03',
    'CAPA initiated from Deviation DEV-2026-001 (Temperature excursion during granulation). Root cause was drifted PT-100 sensor due to loose connection and overdue calibration. CAPA addresses preventive measures for all similar temperature monitoring systems.',
    'CORRECTIVE_AND_PREVENTIVE', 'CLOSED', 'HIGH', 'DEVIATION', 'DEV-2026-001',
    '2026-04-16 09:00:00+05:30', '2026-05-30 23:59:00+05:30', '2026-05-25 16:00:00+05:30', '2026-05-30 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'Metformin Hydrochloride Tablets IP 500mg', 'METF-2026-002',
    '10000000-0000-0000-0000-000000000001',
    'Closed',
    'd0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003',
    '2026-05-25 16:00:00+05:30'
)
ON CONFLICT (capa_number) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, status = EXCLUDED.status,
    actual_completion_date = EXCLUDED.actual_completion_date, deviation_id = EXCLUDED.deviation_id,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by,
    closed_at = EXCLUDED.closed_at;

-- Link deviation 1 to CAPA 1
UPDATE deviations SET capa_id = '20000000-0000-0000-0000-000000000001' WHERE id = '10000000-0000-0000-0000-000000000001';

-- CAPA-2026-002: INVESTIGATION (linked to DEV-2026-002 tablet press)
INSERT INTO capas (id, capa_number, title, description, type, status, priority, source_type, source_reference,
    initiated_date, target_completion_date, due_date,
    initiator_id, owner_id, department_id, plant_site_id,
    product, batch_number, deviation_id,
    current_workflow_step, created_by, updated_by)
VALUES (
    '20000000-0000-0000-0000-000000000002', 'CAPA-2026-002',
    'Investigation of Compression Force Variation on Cadmach CTX-45',
    'CAPA initiated to investigate and address the compression force variation issue on the Cadmach CTX-45 tablet press. The deviation DEV-2026-002 reported intermittent force variations affecting hardness of tablets at stations 12 and 15.',
    'CORRECTIVE', 'INVESTIGATION', 'HIGH', 'DEVIATION', 'DEV-2026-002',
    '2026-06-12 09:00:00+05:30', '2026-07-25 23:59:00+05:30', '2026-07-25 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'Paracetamol Tablets IP 650mg', 'PARA-2026-002',
    '10000000-0000-0000-0000-000000000002',
    'Investigation',
    'd0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005'
)
ON CONFLICT (capa_number) DO UPDATE SET
    title = EXCLUDED.title, status = EXCLUDED.status, deviation_id = EXCLUDED.deviation_id,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;

-- CAPA-2026-003: ACTION_PLANNING (from audit finding)
INSERT INTO capas (id, capa_number, title, description, type, status, priority, source_type, source_reference,
    initiated_date, target_completion_date, due_date,
    initiator_id, owner_id, department_id, plant_site_id,
    current_workflow_step, created_by, updated_by)
VALUES (
    '20000000-0000-0000-0000-000000000003', 'CAPA-2026-003',
    'Improve Document Control Process for SOP Revisions',
    'Internal audit finding: The current document control process does not ensure timely training completion before SOP effective dates. Multiple instances of SOPs becoming effective without all relevant personnel being trained were identified.',
    'PREVENTIVE', 'ACTION_PLANNING', 'MEDIUM', 'AUDIT_FINDING', 'AUD-2026-INT-001',
    '2026-06-06 09:00:00+05:30', '2026-08-15 23:59:00+05:30', '2026-08-15 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000011',
    'd0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Action Planning',
    'd0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000009'
)
ON CONFLICT (capa_number) DO UPDATE SET
    title = EXCLUDED.title, status = EXCLUDED.status,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;

-- CAPA-2026-004: EFFECTIVENESS_CHECK
INSERT INTO capas (id, capa_number, title, description, type, status, priority, source_type, source_reference,
    initiated_date, target_completion_date, due_date,
    initiator_id, owner_id, department_id, plant_site_id,
    current_workflow_step, created_by, updated_by)
VALUES (
    '20000000-0000-0000-0000-000000000004', 'CAPA-2026-004',
    'Corrective Action for Warehouse Storage Temperature Monitoring',
    'OOS result for warehouse temperature monitoring in Zone C. Corrective actions implemented to add redundant temperature sensors and alarm system upgrade. Effectiveness check scheduled.',
    'CORRECTIVE', 'EFFECTIVENESS_CHECK', 'MEDIUM', 'OOS_RESULT', 'OOS-WH-2026-003',
    '2026-05-01 09:00:00+05:30', '2026-07-01 23:59:00+05:30', '2026-07-01 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000001',
    'Effectiveness Check',
    'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000008'
)
ON CONFLICT (capa_number) DO UPDATE SET
    title = EXCLUDED.title, status = EXCLUDED.status,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;

-- CAPA-2026-005: INITIATED (brand new)
INSERT INTO capas (id, capa_number, title, description, type, status, priority, source_type, source_reference,
    initiated_date, target_completion_date, due_date,
    initiator_id, owner_id, department_id, plant_site_id,
    current_workflow_step, created_by, updated_by)
VALUES (
    '20000000-0000-0000-0000-000000000005', 'CAPA-2026-005',
    'Preventive Action for Raw Material COA Verification Process',
    'Following deviation DEV-2026-003 (COA discrepancy for Cetirizine API), a preventive CAPA is initiated to strengthen the incoming raw material COA verification process across all APIs.',
    'PREVENTIVE', 'INITIATED', 'HIGH', 'DEVIATION', 'DEV-2026-003',
    '2026-06-19 09:00:00+05:30', '2026-08-19 23:59:00+05:30', '2026-08-19 23:59:00+05:30',
    'd0000000-0000-0000-0000-000000000014',
    'd0000000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Initiation',
    'd0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000014'
)
ON CONFLICT (capa_number) DO UPDATE SET
    title = EXCLUDED.title, status = EXCLUDED.status,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;


-- ============================================================================
-- 7. CAPA SUPPORTING DATA (RCA, actions, effectiveness checks)
-- Delete existing child data for these CAPAs first, then re-insert
-- ============================================================================

-- Clean up existing child records for idempotent re-run
DELETE FROM capa_five_why_entries WHERE rca_id IN (
    '21000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000002'
);
DELETE FROM capa_five_why_entries WHERE rca_id IN (
    SELECT id FROM capa_root_cause_analyses WHERE capa_id IN (
        '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'
    )
);
DELETE FROM capa_root_cause_analyses WHERE id IN (
    '21000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000002'
);
DELETE FROM capa_root_cause_analyses WHERE capa_id IN (
    '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'
);
DELETE FROM capa_actions WHERE id IN (
    '22000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000003',
    '22000000-0000-0000-0000-000000000004',
    '22000000-0000-0000-0000-000000000005'
);
DELETE FROM capa_actions WHERE capa_id IN (
    '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003'
);
DELETE FROM capa_effectiveness_checks WHERE id = '23000000-0000-0000-0000-000000000001';
DELETE FROM capa_effectiveness_checks WHERE capa_id = '20000000-0000-0000-0000-000000000001';

-- RCA for CAPA-2026-001 (completed)
INSERT INTO capa_root_cause_analyses (id, capa_id, method, description, root_causes, contributing_factors, completed_date, completed_by_id)
VALUES (
    '21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
    'FIVE_WHY',
    'Five-Why analysis performed on temperature excursion during granulation of Metformin batch METF-2026-002',
    ARRAY['PT-100 temperature sensor drift of +7C due to loose terminal connection', 'Overdue preventive maintenance - sensor calibration was 2 months past schedule'],
    ARRAY['No redundant temperature sensing', 'PM schedule tracking was manual and prone to oversight'],
    '2026-04-20 16:00:00+05:30',
    'd0000000-0000-0000-0000-000000000006'
);

INSERT INTO capa_five_why_entries (rca_id, level, question, answer) VALUES
('21000000-0000-0000-0000-000000000001', 1, 'Why did the temperature exceed the validated range?', 'The PID controller received incorrect temperature feedback from the drifted sensor'),
('21000000-0000-0000-0000-000000000001', 2, 'Why was the sensor providing incorrect readings?', 'The PT-100 sensor had drifted +7C from its calibrated value'),
('21000000-0000-0000-0000-000000000001', 3, 'Why did the sensor drift?', 'A loose connection at the terminal block caused signal degradation'),
('21000000-0000-0000-0000-000000000001', 4, 'Why was the loose connection not detected?', 'The sensor calibration was overdue by 2 months; routine calibration would have detected the issue'),
('21000000-0000-0000-0000-000000000001', 5, 'Why was the calibration overdue?', 'PM scheduling was tracked manually and the overdue item was missed in the monthly review');

-- Actions for CAPA-2026-001 (completed)
INSERT INTO capa_actions (id, capa_id, action_number, description, type, status, assigned_to_id, due_date, completed_date, evidence, verified_by_id, verified_date, verification_comments) VALUES
('22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'CA-001',
 'Replace PT-100 sensor on HSG-03 and recalibrate all temperature sensors',
 'CORRECTIVE', 'VERIFIED', 'd0000000-0000-0000-0000-000000000008',
 '2026-04-25 23:59:00+05:30', '2026-04-22 14:00:00+05:30',
 'Sensor replaced and calibrated. Calibration certificate CAL-2026-HSG03-001 attached.',
 'd0000000-0000-0000-0000-000000000004', '2026-04-24 10:00:00+05:30',
 'Calibration certificate verified. All readings within tolerance.'),
('22000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'PA-001',
 'Implement CMMS-based PM scheduling for all critical instrument calibrations',
 'PREVENTIVE', 'VERIFIED', 'd0000000-0000-0000-0000-000000000008',
 '2026-05-15 23:59:00+05:30', '2026-05-10 16:00:00+05:30',
 'CMMS module configured for all granulation equipment sensors. Auto-notifications enabled 30/14/7 days before due.',
 'd0000000-0000-0000-0000-000000000004', '2026-05-12 10:00:00+05:30',
 'CMMS configuration verified. Test notifications received by Engineering team.'),
('22000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'PA-002',
 'Install redundant temperature sensor on all high shear granulators with dual-channel alarm',
 'PREVENTIVE', 'VERIFIED', 'd0000000-0000-0000-0000-000000000008',
 '2026-05-25 23:59:00+05:30', '2026-05-20 16:00:00+05:30',
 'Redundant PT-100 sensors installed on HSG-01, HSG-02, HSG-03. Dual alarm system tested per IQ/OQ protocol.',
 'd0000000-0000-0000-0000-000000000004', '2026-05-22 10:00:00+05:30',
 'IQ/OQ documentation reviewed and approved. Dual alarm system functional.');

-- Effectiveness check for CAPA-2026-001
INSERT INTO capa_effectiveness_checks (id, capa_id, criteria, check_date, result, evidence, verified_by_id, comments, check_number)
VALUES (
    '23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
    'No temperature excursions on any granulator for 30 days post-implementation. All PM calibrations completed on time.',
    '2026-05-25 10:00:00+05:30', 'EFFECTIVE',
    'Zero temperature excursions recorded across all 3 HSG units for 30 consecutive days. All 12 scheduled calibrations completed on time per CMMS records.',
    'd0000000-0000-0000-0000-000000000003',
    'CAPA actions demonstrated effective prevention. No recurrence observed.', 1
);

-- RCA for CAPA-2026-002 (in progress)
INSERT INTO capa_root_cause_analyses (id, capa_id, method, description, root_causes, contributing_factors)
VALUES (
    '21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
    'FISHBONE',
    'Fishbone (Ishikawa) analysis for compression force variation on CTX-45 tablet press - investigation in progress',
    ARRAY['Investigation ongoing - preliminary: worn punch tooling at stations 12 and 15'],
    ARRAY['High production volume without intermediate tooling inspection', 'Granule flow variation from new supplier API batch']
);

-- Actions for CAPA-2026-003 (pending, in ACTION_PLANNING)
INSERT INTO capa_actions (id, capa_id, action_number, description, type, status, assigned_to_id, due_date) VALUES
('22000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'PA-001',
 'Implement automated training assignment trigger when SOP revision becomes effective',
 'PREVENTIVE', 'PENDING', 'd0000000-0000-0000-0000-000000000010',
 '2026-07-30 23:59:00+05:30'),
('22000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'PA-002',
 'Add training completion gate in document control workflow - SOP cannot be made effective until training is complete',
 'PREVENTIVE', 'PENDING', 'd0000000-0000-0000-0000-000000000009',
 '2026-08-10 23:59:00+05:30');


-- ============================================================================
-- 8. CHANGE CONTROL RECORDS (at various workflow stages)
-- ============================================================================

-- CC-2026-001: CLOSED (linked to CAPA-2026-001)
INSERT INTO change_requests (id, change_number, title, description, justification,
    type, category, classification, status, priority,
    requested_by_id, requested_date, department_id,
    change_owner_id, qa_reviewer_id, ra_reviewer_id,
    plant_site_id, affected_areas,
    target_implementation_date, actual_implementation_date, effectiveness_check_date, closed_date,
    regulatory_filing_required, validation_required, validation_details, training_required,
    related_deviations, related_capas,
    current_workflow_step, created_by, updated_by)
VALUES (
    '30000000-0000-0000-0000-000000000001', 'CC-2026-001',
    'Installation of Redundant Temperature Sensors on High Shear Granulators',
    'Install dual PT-100 temperature sensors with independent alarm channels on all 3 high shear granulators (HSG-01, HSG-02, HSG-03) as part of CAPA-2026-001 preventive action.',
    'CAPA PA-002 from DEV-2026-001 requires redundant temperature monitoring to prevent recurrence of temperature excursions during granulation.',
    'EQUIPMENT', 'PRODUCT', 'MAJOR', 'CLOSED', 'HIGH',
    'd0000000-0000-0000-0000-000000000008', '2026-05-01 09:00:00+05:30',
    'c0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000008',
    'd0000000-0000-0000-0000-000000000004',
    NULL,
    'b0000000-0000-0000-0000-000000000001',
    ARRAY['Granulation Suite GR-01', 'Granulation Suite GR-02', 'Granulation Suite GR-03'],
    '2026-05-20 23:59:00+05:30', '2026-05-18 16:00:00+05:30', '2026-06-18 10:00:00+05:30', '2026-06-20 16:00:00+05:30',
    FALSE, TRUE, 'IQ/OQ required for modified temperature monitoring system per CSV SOP-VAL-005',
    TRUE,
    ARRAY['DEV-2026-001'], ARRAY['CAPA-2026-001'],
    'Closed',
    'd0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (change_number) DO UPDATE SET
    title = EXCLUDED.title, status = EXCLUDED.status,
    actual_implementation_date = EXCLUDED.actual_implementation_date,
    closed_date = EXCLUDED.closed_date,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;

-- CC-2026-002: IMPACT_ASSESSMENT
INSERT INTO change_requests (id, change_number, title, description, justification,
    type, category, classification, status, priority,
    requested_by_id, requested_date, department_id,
    change_owner_id, qa_reviewer_id,
    plant_site_id, affected_areas,
    target_implementation_date,
    regulatory_filing_required, validation_required, training_required,
    current_workflow_step, created_by, updated_by)
VALUES (
    '30000000-0000-0000-0000-000000000002', 'CC-2026-002',
    'API Supplier Change - Cetirizine HCl from Alternate Vendor',
    'Qualify alternate API supplier (Laurus Labs) for Cetirizine HCl to reduce dependency on single source. Current sole supplier (Aurobindo) had COA discrepancy issue (DEV-2026-003).',
    'Supply chain risk mitigation and quality concern from recent COA discrepancy. Alternate vendor qualification required per SOP-SQM-003.',
    'SUPPLIER', 'PRODUCT', 'MAJOR', 'IMPACT_ASSESSMENT', 'HIGH',
    'd0000000-0000-0000-0000-000000000014', '2026-06-20 09:00:00+05:30',
    'c0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000014',
    'd0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    ARRAY['QC Lab', 'Warehouse Incoming Area', 'Production - Tablet Coating'],
    '2026-09-30 23:59:00+05:30',
    TRUE, TRUE, TRUE,
    'Impact Assessment',
    'd0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000014'
)
ON CONFLICT (change_number) DO UPDATE SET
    title = EXCLUDED.title, status = EXCLUDED.status,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;

-- CC-2026-003: PENDING_APPROVAL
INSERT INTO change_requests (id, change_number, title, description, justification,
    type, category, classification, status, priority,
    requested_by_id, requested_date, department_id,
    change_owner_id, qa_reviewer_id, ra_reviewer_id,
    plant_site_id, affected_areas,
    target_implementation_date,
    regulatory_filing_required, validation_required, training_required,
    related_deviations,
    current_workflow_step, created_by, updated_by)
VALUES (
    '30000000-0000-0000-0000-000000000003', 'CC-2026-003',
    'Upgrade Water Purification System - RO Membrane Replacement',
    'Replace existing RO membranes on Purified Water System PW-02 with higher rejection rate membranes to address recurring TOC excursions.',
    'Multiple TOC excursions on PW Loop 2 in last quarter (DEV-2026-004 and 2 previous events). Current membranes are at 85% of recommended service life.',
    'EQUIPMENT', 'NON_PRODUCT', 'MAJOR', 'PENDING_APPROVAL', 'MEDIUM',
    'd0000000-0000-0000-0000-000000000008', '2026-06-21 09:00:00+05:30',
    'c0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000008',
    'd0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000013',
    'b0000000-0000-0000-0000-000000000001',
    ARRAY['Water Generation Room', 'All production areas using PW Loop 2'],
    '2026-08-15 23:59:00+05:30',
    FALSE, TRUE, TRUE,
    ARRAY['DEV-2026-004'],
    'Pending Approval',
    'd0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004'
)
ON CONFLICT (change_number) DO UPDATE SET
    title = EXCLUDED.title, status = EXCLUDED.status,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;

-- CC-2026-004: DRAFT (new, just created)
INSERT INTO change_requests (id, change_number, title, description, justification,
    type, category, classification, status, priority,
    requested_by_id, requested_date, department_id,
    change_owner_id,
    plant_site_id,
    target_implementation_date,
    regulatory_filing_required, validation_required, training_required,
    current_workflow_step, created_by, updated_by)
VALUES (
    '30000000-0000-0000-0000-000000000004', 'CC-2026-004',
    'Implementation of Electronic Batch Record System',
    'Replace paper-based batch manufacturing records with electronic batch record (EBR) system for all oral solid dosage manufacturing lines.',
    'Digital transformation initiative to improve data integrity, reduce documentation errors, and enable real-time batch review. Aligns with Revised Schedule M 2024 requirements.',
    'SYSTEM', 'QUALITY_SYSTEM', 'CRITICAL', 'DRAFT', 'HIGH',
    'd0000000-0000-0000-0000-000000000001', '2026-06-22 09:00:00+05:30',
    'c0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '2026-12-31 23:59:00+05:30',
    FALSE, TRUE, TRUE,
    'Draft',
    'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (change_number) DO UPDATE SET
    title = EXCLUDED.title, status = EXCLUDED.status,
    current_workflow_step = EXCLUDED.current_workflow_step, updated_by = EXCLUDED.updated_by;


-- ============================================================================
-- 9. CHANGE CONTROL SUPPORTING DATA
-- Delete existing child data first for idempotent re-run
-- ============================================================================

DELETE FROM change_impact_assessments WHERE change_request_id = (SELECT id FROM change_requests WHERE change_number = 'CC-2026-001');
DELETE FROM change_approvals WHERE change_request_id IN (
    (SELECT id FROM change_requests WHERE change_number = 'CC-2026-001'),
    (SELECT id FROM change_requests WHERE change_number = 'CC-2026-003')
);
DELETE FROM change_affected_documents WHERE change_request_id = (SELECT id FROM change_requests WHERE change_number = 'CC-2026-001');

-- Impact assessment for CC-2026-001
INSERT INTO change_impact_assessments (change_request_id, product_quality, patient_safety, regulatory_compliance,
    validation_status, documentation, training, supplier_qualification, stability,
    overall_risk_level, assessment_summary, assessed_by_id)
VALUES (
    (SELECT id FROM change_requests WHERE change_number = 'CC-2026-001'), 'LOW', 'NO_IMPACT', 'NO_IMPACT',
    'MEDIUM', 'MEDIUM', 'LOW', 'NO_IMPACT', 'NO_IMPACT',
    'MEDIUM',
    'Adding redundant temperature sensors is a non-product-contact change. Requires IQ/OQ validation for modified monitoring system. SOPs for granulation and equipment operation need revision. Training required for operators and maintenance staff.',
    'd0000000-0000-0000-0000-000000000008'
);

-- Approvals for CC-2026-001 (completed)
INSERT INTO change_approvals (change_request_id, approver_id, role, department, decision, comments, decision_date, approval_order) VALUES
((SELECT id FROM change_requests WHERE change_number = 'CC-2026-001'), 'd0000000-0000-0000-0000-000000000004', 'QA Reviewer', 'Quality Assurance', 'APPROVED', 'Reviewed impact assessment. Change is necessary per CAPA PA-002.', '2026-05-05 10:00:00+05:30', 1),
((SELECT id FROM change_requests WHERE change_number = 'CC-2026-001'), 'd0000000-0000-0000-0000-000000000003', 'QA Approver', 'Quality Assurance', 'APPROVED', 'Approved. Validation protocol to be completed before go-live.', '2026-05-06 14:00:00+05:30', 2),
((SELECT id FROM change_requests WHERE change_number = 'CC-2026-001'), 'd0000000-0000-0000-0000-000000000002', 'Site Quality Head', 'Quality Assurance', 'APPROVED', 'Final approval granted.', '2026-05-07 09:00:00+05:30', 3);

-- Approvals for CC-2026-003 (pending)
INSERT INTO change_approvals (change_request_id, approver_id, role, department, decision, approval_order) VALUES
((SELECT id FROM change_requests WHERE change_number = 'CC-2026-003'), 'd0000000-0000-0000-0000-000000000003', 'QA Approver', 'Quality Assurance', 'PENDING', 1),
((SELECT id FROM change_requests WHERE change_number = 'CC-2026-003'), 'd0000000-0000-0000-0000-000000000002', 'Site Quality Head', 'Quality Assurance', 'PENDING', 2);

-- Affected documents for CC-2026-001
INSERT INTO change_affected_documents (change_request_id, document_number, document_title, document_type, current_version, action, new_version, status) VALUES
((SELECT id FROM change_requests WHERE change_number = 'CC-2026-001'), 'SOP-PRD-015', 'Wet Granulation Operation', 'SOP', '04', 'REVISE', '05', 'COMPLETED'),
((SELECT id FROM change_requests WHERE change_number = 'CC-2026-001'), 'SOP-ENG-008', 'Temperature Sensor Calibration', 'SOP', '02', 'REVISE', '03', 'COMPLETED'),
((SELECT id FROM change_requests WHERE change_number = 'CC-2026-001'), 'VAL-2026-HSG-001', 'IQ/OQ Protocol for Redundant Temperature Sensors', 'Validation Protocol', NULL, 'CREATE_NEW', '01', 'COMPLETED');


-- ============================================================================
-- 10. WORKFLOW HISTORY (for lifecycle progress bars in UI)
-- Delete existing workflow_history for these records first, then re-insert
-- ============================================================================

DELETE FROM workflow_history WHERE record_type = 'DEVIATION' AND record_id IN (
    '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'),
    (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'),
    (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-008')
);
DELETE FROM workflow_history WHERE record_type = 'CAPA' AND record_id IN (
    '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005'
);
DELETE FROM workflow_history WHERE record_type = 'CHANGE_CONTROL' AND record_id IN (
    '30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003'
);

-- DEV-2026-001 (CLOSED) - full lifecycle
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Reported',          'COMPLETED', 'd0000000-0000-0000-0000-000000000007', '2026-04-05 11:00:00+05:30', '2026-04-05 11:30:00+05:30', 'Deviation reported by production operator', 1),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Under Review',      'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-04-05 11:30:00+05:30', '2026-04-05 14:00:00+05:30', 'Classified as MAJOR deviation', 2),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Investigation',     'COMPLETED', 'd0000000-0000-0000-0000-000000000006', '2026-04-06 09:00:00+05:30', '2026-04-15 17:00:00+05:30', 'Root cause: drifted PT-100 sensor', 3),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Impact Assessment', 'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-04-16 09:00:00+05:30', '2026-04-17 14:00:00+05:30', 'Medium risk - GMP impact but no product quality impact', 4),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Disposition',       'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-04-17 14:00:00+05:30', '2026-04-18 10:00:00+05:30', 'Release with conditions approved', 5),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'CAPA Initiated',    'COMPLETED', 'd0000000-0000-0000-0000-000000000005', '2026-04-18 10:00:00+05:30', '2026-04-20 09:00:00+05:30', 'CAPA-2026-001 initiated', 6),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Pending Closure',   'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-04-25 09:00:00+05:30', '2026-04-28 16:00:00+05:30', 'All actions verified', 7),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'Closed',            'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-04-28 16:00:00+05:30', '2026-04-28 16:00:00+05:30', 'Deviation closed with e-signature', 8);

-- DEV-2026-002 (INVESTIGATION)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Reported',          'COMPLETED', 'd0000000-0000-0000-0000-000000000007', '2026-06-10 14:45:00+05:30', '2026-06-10 15:00:00+05:30', NULL, 1),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Under Review',      'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-06-10 15:00:00+05:30', '2026-06-11 09:00:00+05:30', 'Classified as MAJOR', 2),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Investigation',     'CURRENT',   'd0000000-0000-0000-0000-000000000006', '2026-06-11 09:00:00+05:30', NULL, 'Fishbone analysis in progress', 3),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Impact Assessment', 'PENDING',   NULL, NULL, NULL, NULL, 4),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Disposition',       'PENDING',   NULL, NULL, NULL, NULL, 5),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Closed',            'PENDING',   NULL, NULL, NULL, NULL, 6);

-- DEV-2026-003 (REPORTED - just submitted)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('DEVIATION', '10000000-0000-0000-0000-000000000003', 'Reported',          'CURRENT',   'd0000000-0000-0000-0000-000000000012', '2026-06-18 10:00:00+05:30', NULL, 'Awaiting QA review', 1),
('DEVIATION', '10000000-0000-0000-0000-000000000003', 'Under Review',      'PENDING',   NULL, NULL, NULL, NULL, 2),
('DEVIATION', '10000000-0000-0000-0000-000000000003', 'Investigation',     'PENDING',   NULL, NULL, NULL, NULL, 3),
('DEVIATION', '10000000-0000-0000-0000-000000000003', 'Disposition',       'PENDING',   NULL, NULL, NULL, NULL, 4),
('DEVIATION', '10000000-0000-0000-0000-000000000003', 'Closed',            'PENDING',   NULL, NULL, NULL, NULL, 5);

-- DEV-2026-004 (UNDER_REVIEW)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'), 'Reported',          'COMPLETED', 'd0000000-0000-0000-0000-000000000012', '2026-06-20 07:00:00+05:30', '2026-06-20 08:00:00+05:30', NULL, 1),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'), 'Under Review',      'CURRENT',   'd0000000-0000-0000-0000-000000000004', '2026-06-20 08:00:00+05:30', NULL, 'QA triage in progress', 2),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'), 'Investigation',     'PENDING',   NULL, NULL, NULL, NULL, 3),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'), 'Disposition',       'PENDING',   NULL, NULL, NULL, NULL, 4),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'), 'Closed',            'PENDING',   NULL, NULL, NULL, NULL, 5);

-- DEV-2026-007 (DISPOSITION)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'Reported',          'COMPLETED', 'd0000000-0000-0000-0000-000000000007', '2026-06-08 11:15:00+05:30', '2026-06-08 11:30:00+05:30', NULL, 1),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'Under Review',      'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-06-08 11:30:00+05:30', '2026-06-08 14:00:00+05:30', 'CRITICAL classification', 2),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'Investigation',     'COMPLETED', 'd0000000-0000-0000-0000-000000000006', '2026-06-09 09:00:00+05:30', '2026-06-13 17:00:00+05:30', 'Line clearance procedure failure identified', 3),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'Impact Assessment', 'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-06-14 09:00:00+05:30', '2026-06-15 14:00:00+05:30', 'Critical risk - potential patient safety impact', 4),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'Disposition',       'CURRENT',   'd0000000-0000-0000-0000-000000000003', '2026-06-15 14:00:00+05:30', NULL, 'Awaiting QA Manager disposition decision', 5),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'Closed',            'PENDING',   NULL, NULL, NULL, NULL, 6);

-- DEV-2026-008 (PENDING_CLOSURE)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-008'), 'Reported',          'COMPLETED', 'd0000000-0000-0000-0000-000000000011', '2026-06-05 14:30:00+05:30', '2026-06-05 15:00:00+05:30', NULL, 1),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-008'), 'Under Review',      'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-06-05 15:00:00+05:30', '2026-06-06 09:00:00+05:30', 'Minor classification', 2),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-008'), 'Investigation',     'COMPLETED', 'd0000000-0000-0000-0000-000000000010', '2026-06-06 09:00:00+05:30', '2026-06-10 16:00:00+05:30', 'Training gap root cause identified', 3),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-008'), 'Disposition',       'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-06-10 16:00:00+05:30', '2026-06-12 10:00:00+05:30', 'Corrective training completed', 4),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-008'), 'Pending Closure',   'CURRENT',   'd0000000-0000-0000-0000-000000000003', '2026-06-12 10:00:00+05:30', NULL, 'Awaiting final closure e-signature', 5),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-008'), 'Closed',            'PENDING',   NULL, NULL, NULL, NULL, 6);

-- CAPA-2026-001 (CLOSED) - full lifecycle
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('CAPA', '20000000-0000-0000-0000-000000000001', 'Initiation',           'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-04-16 09:00:00+05:30', '2026-04-16 14:00:00+05:30', 'CAPA initiated from DEV-2026-001', 1),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Investigation',        'COMPLETED', 'd0000000-0000-0000-0000-000000000006', '2026-04-16 14:00:00+05:30', '2026-04-20 16:00:00+05:30', 'Five-Why analysis completed', 2),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Root Cause Identified','COMPLETED', 'd0000000-0000-0000-0000-000000000005', '2026-04-20 16:00:00+05:30', '2026-04-22 09:00:00+05:30', 'Root cause confirmed and documented', 3),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Action Planning',      'COMPLETED', 'd0000000-0000-0000-0000-000000000005', '2026-04-22 09:00:00+05:30', '2026-04-25 14:00:00+05:30', '3 actions planned (1 CA + 2 PA)', 4),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Action Execution',     'COMPLETED', 'd0000000-0000-0000-0000-000000000008', '2026-04-25 14:00:00+05:30', '2026-05-20 16:00:00+05:30', 'All 3 actions completed and verified', 5),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Effectiveness Check',  'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-05-20 16:00:00+05:30', '2026-05-25 10:00:00+05:30', 'Effectiveness verified - no recurrence', 6),
('CAPA', '20000000-0000-0000-0000-000000000001', 'Closed',               'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-05-25 10:00:00+05:30', '2026-05-25 16:00:00+05:30', 'CAPA closed with e-signature', 7);

-- CAPA-2026-002 (INVESTIGATION)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('CAPA', '20000000-0000-0000-0000-000000000002', 'Initiation',           'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-06-12 09:00:00+05:30', '2026-06-12 14:00:00+05:30', NULL, 1),
('CAPA', '20000000-0000-0000-0000-000000000002', 'Investigation',        'CURRENT',   'd0000000-0000-0000-0000-000000000006', '2026-06-12 14:00:00+05:30', NULL, 'Fishbone analysis in progress', 2),
('CAPA', '20000000-0000-0000-0000-000000000002', 'Root Cause Identified','PENDING',   NULL, NULL, NULL, NULL, 3),
('CAPA', '20000000-0000-0000-0000-000000000002', 'Action Planning',      'PENDING',   NULL, NULL, NULL, NULL, 4),
('CAPA', '20000000-0000-0000-0000-000000000002', 'Effectiveness Check',  'PENDING',   NULL, NULL, NULL, NULL, 5),
('CAPA', '20000000-0000-0000-0000-000000000002', 'Closed',               'PENDING',   NULL, NULL, NULL, NULL, 6);

-- CAPA-2026-003 (ACTION_PLANNING)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('CAPA', '20000000-0000-0000-0000-000000000003', 'Initiation',           'COMPLETED', 'd0000000-0000-0000-0000-000000000011', '2026-06-06 09:00:00+05:30', '2026-06-06 14:00:00+05:30', NULL, 1),
('CAPA', '20000000-0000-0000-0000-000000000003', 'Investigation',        'COMPLETED', 'd0000000-0000-0000-0000-000000000006', '2026-06-06 14:00:00+05:30', '2026-06-10 16:00:00+05:30', NULL, 2),
('CAPA', '20000000-0000-0000-0000-000000000003', 'Root Cause Identified','COMPLETED', 'd0000000-0000-0000-0000-000000000009', '2026-06-10 16:00:00+05:30', '2026-06-12 09:00:00+05:30', NULL, 3),
('CAPA', '20000000-0000-0000-0000-000000000003', 'Action Planning',      'CURRENT',   'd0000000-0000-0000-0000-000000000009', '2026-06-12 09:00:00+05:30', NULL, '2 preventive actions being defined', 4),
('CAPA', '20000000-0000-0000-0000-000000000003', 'Action Execution',     'PENDING',   NULL, NULL, NULL, NULL, 5),
('CAPA', '20000000-0000-0000-0000-000000000003', 'Effectiveness Check',  'PENDING',   NULL, NULL, NULL, NULL, 6),
('CAPA', '20000000-0000-0000-0000-000000000003', 'Closed',               'PENDING',   NULL, NULL, NULL, NULL, 7);

-- CAPA-2026-005 (INITIATED)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, comments, step_order) VALUES
('CAPA', '20000000-0000-0000-0000-000000000005', 'Initiation',           'CURRENT',   'd0000000-0000-0000-0000-000000000014', '2026-06-19 09:00:00+05:30', 'New CAPA awaiting review', 1),
('CAPA', '20000000-0000-0000-0000-000000000005', 'Investigation',        'PENDING',   NULL, NULL, NULL, 2),
('CAPA', '20000000-0000-0000-0000-000000000005', 'Action Planning',      'PENDING',   NULL, NULL, NULL, 3),
('CAPA', '20000000-0000-0000-0000-000000000005', 'Closed',               'PENDING',   NULL, NULL, NULL, 4);

-- CC-2026-001 (CLOSED) - full lifecycle
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Draft',                'COMPLETED', 'd0000000-0000-0000-0000-000000000008', '2026-05-01 09:00:00+05:30', '2026-05-01 16:00:00+05:30', NULL, 1),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Submitted',            'COMPLETED', 'd0000000-0000-0000-0000-000000000008', '2026-05-01 16:00:00+05:30', '2026-05-02 09:00:00+05:30', NULL, 2),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Impact Assessment',    'COMPLETED', 'd0000000-0000-0000-0000-000000000008', '2026-05-02 09:00:00+05:30', '2026-05-04 14:00:00+05:30', NULL, 3),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'QA Review',            'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-05-04 14:00:00+05:30', '2026-05-05 10:00:00+05:30', NULL, 4),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Pending Approval',     'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-05-05 10:00:00+05:30', '2026-05-07 09:00:00+05:30', 'Approved by all approvers', 5),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Implementation',       'COMPLETED', 'd0000000-0000-0000-0000-000000000008', '2026-05-07 09:00:00+05:30', '2026-05-18 16:00:00+05:30', NULL, 6),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Verification',         'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-05-18 16:00:00+05:30', '2026-06-18 10:00:00+05:30', NULL, 7),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Effectiveness Check',  'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-06-18 10:00:00+05:30', '2026-06-20 14:00:00+05:30', NULL, 8),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'Closed',               'COMPLETED', 'd0000000-0000-0000-0000-000000000003', '2026-06-20 14:00:00+05:30', '2026-06-20 16:00:00+05:30', 'Change closed', 9);

-- CC-2026-002 (IMPACT_ASSESSMENT)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000002', 'Draft',             'COMPLETED', 'd0000000-0000-0000-0000-000000000014', '2026-06-20 09:00:00+05:30', '2026-06-20 14:00:00+05:30', NULL, 1),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000002', 'Submitted',         'COMPLETED', 'd0000000-0000-0000-0000-000000000014', '2026-06-20 14:00:00+05:30', '2026-06-20 16:00:00+05:30', NULL, 2),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000002', 'Impact Assessment', 'CURRENT',   'd0000000-0000-0000-0000-000000000014', '2026-06-20 16:00:00+05:30', NULL, 'Assessing supplier change impact', 3),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000002', 'QA Review',         'PENDING',   NULL, NULL, NULL, NULL, 4),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000002', 'Pending Approval',  'PENDING',   NULL, NULL, NULL, NULL, 5),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000002', 'Closed',            'PENDING',   NULL, NULL, NULL, NULL, 6);

-- CC-2026-003 (PENDING_APPROVAL)
INSERT INTO workflow_history (record_type, record_id, step_name, status, assigned_to_id, started_at, completed_at, comments, step_order) VALUES
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'Draft',             'COMPLETED', 'd0000000-0000-0000-0000-000000000008', '2026-06-21 09:00:00+05:30', '2026-06-21 11:00:00+05:30', NULL, 1),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'Submitted',         'COMPLETED', 'd0000000-0000-0000-0000-000000000008', '2026-06-21 11:00:00+05:30', '2026-06-21 12:00:00+05:30', NULL, 2),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'Impact Assessment', 'COMPLETED', 'd0000000-0000-0000-0000-000000000008', '2026-06-21 12:00:00+05:30', '2026-06-22 09:00:00+05:30', NULL, 3),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'QA Review',         'COMPLETED', 'd0000000-0000-0000-0000-000000000004', '2026-06-22 09:00:00+05:30', '2026-06-22 14:00:00+05:30', 'Reviewed and recommended approval', 4),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'RA Review',         'COMPLETED', 'd0000000-0000-0000-0000-000000000013', '2026-06-22 14:00:00+05:30', '2026-06-22 17:00:00+05:30', 'No regulatory filing required', 5),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'Pending Approval',  'CURRENT',   'd0000000-0000-0000-0000-000000000003', '2026-06-22 17:00:00+05:30', NULL, 'Awaiting QA Manager and Site Head approval', 6),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'Implementation',    'PENDING',   NULL, NULL, NULL, NULL, 7),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'Closed',            'PENDING',   NULL, NULL, NULL, NULL, 8);


-- ============================================================================
-- 11. ELECTRONIC SIGNATURES (for approved/closed records)
-- ============================================================================

INSERT INTO electronic_signatures (id, user_id, record_type, record_id, action, meaning, signature_hash, signed_at, comments) VALUES
('40000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'DEVIATION', '10000000-0000-0000-0000-000000000001',
 'APPROVE_DISPOSITION', 'I approve the disposition decision for this deviation. I have reviewed the investigation findings and batch test results.',
 '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK', '2026-04-18 10:00:00+05:30',
 'Release with conditions approved. CAPA required.'),
('40000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'DEVIATION', '10000000-0000-0000-0000-000000000001',
 'CLOSE_DEVIATION', 'I confirm that all corrective and preventive actions for this deviation have been completed and verified.',
 '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK', '2026-04-28 16:00:00+05:30',
 'All actions verified. CAPA-2026-001 effectiveness confirmed. Deviation closed.'),
('40000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'CAPA', '20000000-0000-0000-0000-000000000001',
 'CLOSE_CAPA', 'I confirm that all CAPA actions are effective and the CAPA can be closed.',
 '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK', '2026-05-25 16:00:00+05:30',
 'Effectiveness check passed. No recurrence of temperature excursions.'),
('40000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001',
 'APPROVE_CHANGE', 'I approve this change request for implementation.',
 '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK', '2026-05-07 09:00:00+05:30',
 'Final approval. Ensure IQ/OQ is completed before go-live.'),
('40000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001',
 'CLOSE_CHANGE', 'I confirm that this change has been implemented, verified, and is effective.',
 '$2a$10$k2RMa/sPr9IOeS1Suhr6.upkaem/DF4tj5gBi6SoWSYSH3T9kTZuK', '2026-06-20 16:00:00+05:30',
 'All implementation tasks completed. Effectiveness verified.')
ON CONFLICT (id) DO UPDATE SET
    action = EXCLUDED.action, meaning = EXCLUDED.meaning, comments = EXCLUDED.comments;


-- ============================================================================
-- 12. AUDIT TRAIL ENTRIES (for regulatory compliance testing)
-- Delete existing audit trail for these records, then re-insert
-- ============================================================================

DELETE FROM audit_trail WHERE record_type = 'DEVIATION' AND record_id IN (
    '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
    (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'),
    (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007')
);
DELETE FROM audit_trail WHERE record_type = 'CAPA' AND record_id = '20000000-0000-0000-0000-000000000001';
DELETE FROM audit_trail WHERE record_type = 'CHANGE_CONTROL' AND record_id IN (
    '30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003'
);

-- DEV-2026-001 audit trail
INSERT INTO audit_trail (record_type, record_id, record_number, action, field_name, old_value, new_value, user_id, user_name, timestamp) VALUES
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'CREATE', NULL, NULL, NULL, 'd0000000-0000-0000-0000-000000000007', 'Venkat Naidu', '2026-04-05 11:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'STATUS_CHANGE', 'status', 'REPORTED', 'UNDER_REVIEW', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-04-05 11:30:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'CLASSIFY', 'classification', NULL, 'MAJOR', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-04-05 14:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'ASSIGN', 'assigned_to_id', NULL, 'd0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-04-05 14:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'STATUS_CHANGE', 'status', 'UNDER_REVIEW', 'INVESTIGATION', 'd0000000-0000-0000-0000-000000000006', 'Lakshmi Devi', '2026-04-06 09:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'INVESTIGATION_COMPLETE', 'status', 'INVESTIGATION', 'IMPACT_ASSESSMENT', 'd0000000-0000-0000-0000-000000000006', 'Lakshmi Devi', '2026-04-15 17:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'STATUS_CHANGE', 'status', 'IMPACT_ASSESSMENT', 'DISPOSITION', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-04-17 14:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'APPROVE', 'status', 'DISPOSITION', 'CAPA_INITIATED', 'd0000000-0000-0000-0000-000000000003', 'Priya Sharma', '2026-04-18 10:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'STATUS_CHANGE', 'status', 'CAPA_INITIATED', 'PENDING_CLOSURE', 'd0000000-0000-0000-0000-000000000003', 'Priya Sharma', '2026-04-25 09:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000001', 'DEV-2026-001', 'CLOSE', 'status', 'PENDING_CLOSURE', 'CLOSED', 'd0000000-0000-0000-0000-000000000003', 'Priya Sharma', '2026-04-28 16:00:00+05:30');

-- DEV-2026-002 audit trail
INSERT INTO audit_trail (record_type, record_id, record_number, action, field_name, old_value, new_value, user_id, user_name, timestamp) VALUES
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'DEV-2026-002', 'CREATE', NULL, NULL, NULL, 'd0000000-0000-0000-0000-000000000007', 'Venkat Naidu', '2026-06-10 14:45:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'DEV-2026-002', 'STATUS_CHANGE', 'status', 'REPORTED', 'UNDER_REVIEW', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-06-10 15:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'DEV-2026-002', 'CLASSIFY', 'classification', NULL, 'MAJOR', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-06-11 09:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'DEV-2026-002', 'STATUS_CHANGE', 'status', 'CLASSIFIED', 'INVESTIGATION', 'd0000000-0000-0000-0000-000000000006', 'Lakshmi Devi', '2026-06-11 09:00:00+05:30');

-- DEV-2026-004 audit trail
INSERT INTO audit_trail (record_type, record_id, record_number, action, field_name, old_value, new_value, user_id, user_name, timestamp) VALUES
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'), 'DEV-2026-004', 'CREATE', NULL, NULL, NULL, 'd0000000-0000-0000-0000-000000000012', 'Ramesh Gupta', '2026-06-20 07:00:00+05:30'),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'), 'DEV-2026-004', 'STATUS_CHANGE', 'status', 'REPORTED', 'UNDER_REVIEW', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-06-20 08:00:00+05:30');

-- DEV-2026-007 audit trail
INSERT INTO audit_trail (record_type, record_id, record_number, action, field_name, old_value, new_value, user_id, user_name, timestamp) VALUES
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'DEV-2026-007', 'CREATE', NULL, NULL, NULL, 'd0000000-0000-0000-0000-000000000007', 'Venkat Naidu', '2026-06-08 11:15:00+05:30'),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'DEV-2026-007', 'CLASSIFY', 'classification', NULL, 'CRITICAL', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-06-08 14:00:00+05:30'),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'DEV-2026-007', 'STATUS_CHANGE', 'status', 'INVESTIGATION', 'IMPACT_ASSESSMENT', 'd0000000-0000-0000-0000-000000000006', 'Lakshmi Devi', '2026-06-13 17:00:00+05:30'),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'DEV-2026-007', 'STATUS_CHANGE', 'status', 'IMPACT_ASSESSMENT', 'DISPOSITION', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-06-15 14:00:00+05:30');

-- CAPA-2026-001 audit trail
INSERT INTO audit_trail (record_type, record_id, record_number, action, field_name, old_value, new_value, user_id, user_name, timestamp) VALUES
('CAPA', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001', 'CREATE', NULL, NULL, NULL, 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-04-16 09:00:00+05:30'),
('CAPA', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001', 'STATUS_CHANGE', 'status', 'INITIATED', 'INVESTIGATION', 'd0000000-0000-0000-0000-000000000006', 'Lakshmi Devi', '2026-04-16 14:00:00+05:30'),
('CAPA', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001', 'STATUS_CHANGE', 'status', 'INVESTIGATION', 'ROOT_CAUSE_IDENTIFIED', 'd0000000-0000-0000-0000-000000000005', 'Anitha Rao', '2026-04-20 16:00:00+05:30'),
('CAPA', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001', 'STATUS_CHANGE', 'status', 'ROOT_CAUSE_IDENTIFIED', 'ACTION_PLANNING', 'd0000000-0000-0000-0000-000000000005', 'Anitha Rao', '2026-04-22 09:00:00+05:30'),
('CAPA', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001', 'STATUS_CHANGE', 'status', 'ACTION_PLANNING', 'ACTION_IN_PROGRESS', 'd0000000-0000-0000-0000-000000000008', 'Mohammad Ali', '2026-04-25 14:00:00+05:30'),
('CAPA', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001', 'STATUS_CHANGE', 'status', 'ACTION_IN_PROGRESS', 'EFFECTIVENESS_CHECK', 'd0000000-0000-0000-0000-000000000003', 'Priya Sharma', '2026-05-20 16:00:00+05:30'),
('CAPA', '20000000-0000-0000-0000-000000000001', 'CAPA-2026-001', 'CLOSE', 'status', 'EFFECTIVENESS_CHECK', 'CLOSED', 'd0000000-0000-0000-0000-000000000003', 'Priya Sharma', '2026-05-25 16:00:00+05:30');

-- CC-2026-001 audit trail
INSERT INTO audit_trail (record_type, record_id, record_number, action, field_name, old_value, new_value, user_id, user_name, timestamp) VALUES
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'CC-2026-001', 'CREATE', NULL, NULL, NULL, 'd0000000-0000-0000-0000-000000000008', 'Mohammad Ali', '2026-05-01 09:00:00+05:30'),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'CC-2026-001', 'SUBMIT', 'status', 'DRAFT', 'SUBMITTED', 'd0000000-0000-0000-0000-000000000008', 'Mohammad Ali', '2026-05-01 16:00:00+05:30'),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'CC-2026-001', 'STATUS_CHANGE', 'status', 'SUBMITTED', 'IMPACT_ASSESSMENT', 'd0000000-0000-0000-0000-000000000008', 'Mohammad Ali', '2026-05-02 09:00:00+05:30'),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'CC-2026-001', 'STATUS_CHANGE', 'status', 'IMPACT_ASSESSMENT', 'QA_REVIEW', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-05-04 14:00:00+05:30'),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'CC-2026-001', 'APPROVE', 'status', 'PENDING_APPROVAL', 'APPROVED', 'd0000000-0000-0000-0000-000000000002', 'Srinivas Rao', '2026-05-07 09:00:00+05:30'),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000001', 'CC-2026-001', 'CLOSE', 'status', 'EFFECTIVENESS_CHECK', 'CLOSED', 'd0000000-0000-0000-0000-000000000003', 'Priya Sharma', '2026-06-20 16:00:00+05:30');

-- CC-2026-003 audit trail
INSERT INTO audit_trail (record_type, record_id, record_number, action, field_name, old_value, new_value, user_id, user_name, timestamp) VALUES
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'CC-2026-003', 'CREATE', NULL, NULL, NULL, 'd0000000-0000-0000-0000-000000000008', 'Mohammad Ali', '2026-06-21 09:00:00+05:30'),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'CC-2026-003', 'SUBMIT', 'status', 'DRAFT', 'SUBMITTED', 'd0000000-0000-0000-0000-000000000008', 'Mohammad Ali', '2026-06-21 11:00:00+05:30'),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'CC-2026-003', 'STATUS_CHANGE', 'status', 'QA_REVIEW', 'PENDING_APPROVAL', 'd0000000-0000-0000-0000-000000000004', 'Suresh Reddy', '2026-06-22 14:00:00+05:30');


-- ============================================================================
-- 13. RECORD COMMENTS (for discussion threads)
-- Delete existing comments for these records, then re-insert
-- ============================================================================

DELETE FROM record_comments WHERE record_type = 'DEVIATION' AND record_id IN (
    '10000000-0000-0000-0000-000000000002',
    (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'),
    (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007')
);
DELETE FROM record_comments WHERE record_type = 'CAPA' AND record_id IN (
    '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003'
);
DELETE FROM record_comments WHERE record_type = 'CHANGE_CONTROL' AND record_id = '30000000-0000-0000-0000-000000000003';

INSERT INTO record_comments (record_type, record_id, comment_text, comment_type, user_id, created_at) VALUES
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Investigation update: Punch tooling inspection scheduled for tomorrow. Will also check feeder frame alignment.', 'INVESTIGATION', 'd0000000-0000-0000-0000-000000000006', '2026-06-12 16:00:00+05:30'),
('DEVIATION', '10000000-0000-0000-0000-000000000002', 'Please prioritize this investigation. The press is needed for the Paracetamol production schedule next week.', 'GENERAL', 'd0000000-0000-0000-0000-000000000003', '2026-06-13 09:00:00+05:30'),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-004'), 'TOC value at 520 ppb is above alert but we also had 480 ppb readings last week. This may indicate a trend.', 'REVIEW', 'd0000000-0000-0000-0000-000000000004', '2026-06-20 09:30:00+05:30'),
('DEVIATION', (SELECT id FROM deviations WHERE deviation_number = 'DEV-2026-007'), 'Urgent: This is a critical label mix-up. All quarantined packs need 100% visual inspection before any release decision.', 'REVIEW', 'd0000000-0000-0000-0000-000000000003', '2026-06-08 15:00:00+05:30'),
('CAPA', '20000000-0000-0000-0000-000000000002', 'Fishbone diagram has been drafted covering Man, Machine, Material, Method categories. Will upload the diagram by EOD.', 'INVESTIGATION', 'd0000000-0000-0000-0000-000000000006', '2026-06-15 14:00:00+05:30'),
('CAPA', '20000000-0000-0000-0000-000000000003', 'Proposed action: Integrate training assignment with document control module so SOPs cannot go effective without training completion.', 'GENERAL', 'd0000000-0000-0000-0000-000000000009', '2026-06-13 10:00:00+05:30'),
('CHANGE_CONTROL', '30000000-0000-0000-0000-000000000003', 'Validation protocol for RO membrane replacement has been drafted. Requesting engineering review.', 'GENERAL', 'd0000000-0000-0000-0000-000000000016', '2026-06-22 10:00:00+05:30');


-- ============================================================================
-- 14. SUMMARY: What each user should see in "My Tasks" panel
-- ============================================================================
-- These tasks are served by Flowable runtime (ACT_RU_TASK), not by this SQL.
-- When the backend starts Flowable processes for these records, the tasks will
-- appear automatically. The workflow_history above provides the UI lifecycle bar.
--
-- Expected task assignments (for manual testing if Flowable isn't running):
--
-- Suresh Reddy (QA Specialist / QA_REVIEWER):
--   - Review DEV-2026-004 (UNDER_REVIEW - QA triage)
--   - Review DEV-2026-003 (REPORTED - needs QA pickup)
--
-- Priya Sharma (Quality Manager / QA_APPROVER):
--   - Approve disposition DEV-2026-007 (DISPOSITION)
--   - Close DEV-2026-008 (PENDING_CLOSURE)
--   - Approve CC-2026-003 (PENDING_APPROVAL)
--
-- Lakshmi Devi (Investigator):
--   - Complete investigation DEV-2026-002 (INVESTIGATION)
--   - Complete investigation CAPA-2026-002 (INVESTIGATION)
--
-- Anitha Rao (CAPA Coordinator):
--   - Review CAPA-2026-005 (INITIATED)
--
-- Kavitha Krishnan (Doc Control):
--   - Plan action CAPA-2026-003 (ACTION_PLANNING) - PA-002 assigned
--
-- Mohammad Ali (Change Owner / Engineering):
--   - Verify CAPA-2026-004 (EFFECTIVENESS_CHECK)
--   - Submit CC-2026-004 (DRAFT)
--
-- Arun Patel (Supplier Quality):
--   - Complete impact assessment CC-2026-002 (IMPACT_ASSESSMENT)
--   - Review CAPA-2026-005 (INITIATED - owner)
--
-- Srinivas Rao (Site Quality Head):
--   - Approve CC-2026-003 (PENDING_APPROVAL - 2nd approver)
--
-- Ravi Teja (Training Admin):
--   - Plan action CAPA-2026-003 (ACTION_PLANNING) - PA-001 assigned
--
-- Deepa Menon (Auditor):
--   - Read-only access to all records for audit review
--
-- Neha Joshi (Regulatory Affairs):
--   - RA review completed for CC-2026-003 (already done)
--
-- Rajesh Kumar (System Admin):
--   - System config access, no workflow tasks
--
-- Venkat Naidu / Ramesh Gupta (Operators):
--   - Can create new deviations
--   - View their submitted deviations
-- ============================================================================

COMMIT;
