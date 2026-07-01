-- ============================================================================
-- QMS-Pharma Seed Data - Reference/Lookup Data
-- ============================================================================

-- ============================================================================
-- 1. APPLICATION ROLES
-- ============================================================================

INSERT INTO application_roles (id, name, code, description, role_level, is_system) VALUES
(gen_random_uuid(), 'End User',             'END_USER',       'Create and edit records',                      'END_USER',       TRUE),
(gen_random_uuid(), 'Record Owner',         'OWNER',          'Full control over assigned records',           'OWNER',          TRUE),
(gen_random_uuid(), 'Reviewer',             'REVIEWER',       'Read and comment on records',                  'REVIEWER',       TRUE),
(gen_random_uuid(), 'Approver',             'APPROVER',       'Review and approve records',                   'APPROVER',       TRUE),
(gen_random_uuid(), 'QA Reviewer',          'QA_REVIEWER',    'Quality assurance oversight and review',       'QA_REVIEWER',    TRUE),
(gen_random_uuid(), 'QA Approver',          'QA_APPROVER',    'Final quality approval authority',             'QA_APPROVER',    TRUE),
(gen_random_uuid(), 'Training Admin',       'TRAINING_ADMIN', 'Manage curricula and training assignments',    'TRAINING_ADMIN', TRUE),
(gen_random_uuid(), 'System Administrator', 'VAULT_ADMIN',    'Configure system and manage workflows',        'VAULT_ADMIN',    TRUE);

-- ============================================================================
-- 2. SECURITY PROFILES
-- ============================================================================

INSERT INTO security_profiles (id, name, description, is_system) VALUES
(gen_random_uuid(), 'Operator Profile',             'Manufacturing operators - create deviations, complete tasks',    FALSE),
(gen_random_uuid(), 'QA Specialist Profile',        'QA specialists - review investigations, manage workflows',      FALSE),
(gen_random_uuid(), 'Quality Manager Profile',      'Quality managers - approve records, monitor KPIs',              FALSE),
(gen_random_uuid(), 'CAPA Coordinator Profile',     'CAPA coordinators - track CAPA execution',                     FALSE),
(gen_random_uuid(), 'Investigator Profile',         'Investigators/SMEs - perform root cause analysis',             FALSE),
(gen_random_uuid(), 'Change Owner Profile',         'Change owners - execute change controls',                      FALSE),
(gen_random_uuid(), 'Document Control Profile',     'Document control specialists - manage SOP revisions',          FALSE),
(gen_random_uuid(), 'Training Admin Profile',       'Training administrators - assign and monitor training',        FALSE),
(gen_random_uuid(), 'Auditor Profile',              'Auditors - conduct internal/external audits',                  FALSE),
(gen_random_uuid(), 'Site Quality Head Profile',    'Site quality head - final approval authority',                 FALSE),
(gen_random_uuid(), 'System Admin Profile',         'System administrators - full system access',                   TRUE),
(gen_random_uuid(), 'External Supplier Profile',    'External supplier users - limited quality processes',          FALSE);

-- ============================================================================
-- 3. PERMISSIONS
-- ============================================================================

-- CAPA Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('CAPA', 'CREATE',    'capa_record',    'Create new CAPA records'),
('CAPA', 'READ',      'capa_record',    'View CAPA records'),
('CAPA', 'UPDATE',    'capa_record',    'Edit CAPA records'),
('CAPA', 'DELETE',    'capa_record',    'Delete draft CAPA records'),
('CAPA', 'APPROVE',   'capa_record',    'Approve CAPA records'),
('CAPA', 'REJECT',    'capa_record',    'Reject CAPA records'),
('CAPA', 'CLOSE',     'capa_record',    'Close CAPA records'),
('CAPA', 'REOPEN',    'capa_record',    'Reopen closed CAPA records'),
('CAPA', 'ASSIGN',    'capa_record',    'Assign CAPA owner/investigator'),
('CAPA', 'EXPORT',    'capa_report',    'Export CAPA data and reports'),

-- Deviation Permissions
('DEVIATION', 'CREATE',    'deviation_record',    'Create new deviation records'),
('DEVIATION', 'READ',      'deviation_record',    'View deviation records'),
('DEVIATION', 'UPDATE',    'deviation_record',    'Edit deviation records'),
('DEVIATION', 'DELETE',    'deviation_record',    'Delete draft deviation records'),
('DEVIATION', 'APPROVE',   'deviation_record',    'Approve deviation records'),
('DEVIATION', 'REJECT',    'deviation_record',    'Reject deviation records'),
('DEVIATION', 'CLOSE',     'deviation_record',    'Close deviation records'),
('DEVIATION', 'ASSIGN',    'deviation_record',    'Assign deviation investigator'),
('DEVIATION', 'EXPORT',    'deviation_report',    'Export deviation data and reports'),

-- Change Control Permissions
('CHANGE_CONTROL', 'CREATE',    'change_request',    'Create new change requests'),
('CHANGE_CONTROL', 'READ',      'change_request',    'View change requests'),
('CHANGE_CONTROL', 'UPDATE',    'change_request',    'Edit change requests'),
('CHANGE_CONTROL', 'DELETE',    'change_request',    'Delete draft change requests'),
('CHANGE_CONTROL', 'APPROVE',   'change_request',    'Approve change requests'),
('CHANGE_CONTROL', 'REJECT',    'change_request',    'Reject change requests'),
('CHANGE_CONTROL', 'CLOSE',     'change_request',    'Close change requests'),
('CHANGE_CONTROL', 'ASSIGN',    'change_request',    'Assign change owner/reviewers'),
('CHANGE_CONTROL', 'EXPORT',    'change_report',     'Export change control data'),

-- Admin Permissions
('ADMIN', 'CREATE',     'user',            'Create users'),
('ADMIN', 'READ',       'user',            'View users'),
('ADMIN', 'UPDATE',     'user',            'Edit users'),
('ADMIN', 'DELETE',     'user',            'Deactivate users'),
('ADMIN', 'CONFIGURE',  'system',          'Configure system settings'),
('ADMIN', 'CONFIGURE',  'workflow',        'Configure workflows'),
('ADMIN', 'READ',       'audit_trail',     'View audit trail'),
('ADMIN', 'EXPORT',     'audit_trail',     'Export audit trail'),

-- Report Permissions
('REPORT', 'READ',      'dashboard',       'View dashboards'),
('REPORT', 'READ',      'analytics',       'View analytics'),
('REPORT', 'EXPORT',    'report',          'Generate and export reports');

-- ============================================================================
-- 4. LOOKUP VALUES
-- ============================================================================

-- Deviation Categories
INSERT INTO lookup_values (category, code, display_value, sort_order) VALUES
('DEVIATION_CATEGORY', 'PROCESS',        'Process Deviation',        1),
('DEVIATION_CATEGORY', 'EQUIPMENT',      'Equipment Deviation',      2),
('DEVIATION_CATEGORY', 'MATERIAL',       'Material Deviation',       3),
('DEVIATION_CATEGORY', 'DOCUMENTATION',  'Documentation Deviation',  4),
('DEVIATION_CATEGORY', 'ENVIRONMENTAL',  'Environmental Deviation',  5),
('DEVIATION_CATEGORY', 'PERSONNEL',      'Personnel Deviation',      6),
('DEVIATION_CATEGORY', 'UTILITY',        'Utility Deviation',        7),
('DEVIATION_CATEGORY', 'LABORATORY',     'Laboratory Deviation',     8),
('DEVIATION_CATEGORY', 'PACKAGING',      'Packaging Deviation',      9),
('DEVIATION_CATEGORY', 'CLEANING',       'Cleaning Deviation',       10);

-- CAPA Source Types
INSERT INTO lookup_values (category, code, display_value, sort_order) VALUES
('CAPA_SOURCE', 'DEVIATION',               'Deviation',                    1),
('CAPA_SOURCE', 'AUDIT_FINDING',           'Audit Finding',                2),
('CAPA_SOURCE', 'COMPLAINT',               'Customer Complaint',           3),
('CAPA_SOURCE', 'OOS_RESULT',              'Out of Specification Result',  4),
('CAPA_SOURCE', 'RISK_ASSESSMENT',         'Risk Assessment',              5),
('CAPA_SOURCE', 'MANAGEMENT_REVIEW',       'Management Review',            6),
('CAPA_SOURCE', 'REGULATORY_OBSERVATION',  'Regulatory Observation',       7),
('CAPA_SOURCE', 'SELF_IDENTIFIED',         'Self Identified',              8);

-- RCA Methods
INSERT INTO lookup_values (category, code, display_value, sort_order) VALUES
('RCA_METHOD', 'FIVE_WHY',      '5-Why Analysis',                       1),
('RCA_METHOD', 'FISHBONE',      'Fishbone (Ishikawa) Diagram',          2),
('RCA_METHOD', 'FAULT_TREE',    'Fault Tree Analysis',                  3),
('RCA_METHOD', 'PARETO',        'Pareto Analysis',                      4),
('RCA_METHOD', 'FAILURE_MODE',  'Failure Mode & Effect Analysis (FMEA)', 5);

-- Change Control Types
INSERT INTO lookup_values (category, code, display_value, sort_order) VALUES
('CHANGE_TYPE', 'PROCESS',    'Process Change',     1),
('CHANGE_TYPE', 'EQUIPMENT',  'Equipment Change',   2),
('CHANGE_TYPE', 'FACILITY',   'Facility Change',    3),
('CHANGE_TYPE', 'DOCUMENT',   'Document Change',    4),
('CHANGE_TYPE', 'SYSTEM',     'System Change',      5),
('CHANGE_TYPE', 'MATERIAL',   'Material Change',    6),
('CHANGE_TYPE', 'SUPPLIER',   'Supplier Change',    7),
('CHANGE_TYPE', 'REGULATORY', 'Regulatory Change',  8),
('CHANGE_TYPE', 'PACKAGING',  'Packaging Change',   9),
('CHANGE_TYPE', 'METHOD',     'Method Change',      10);

-- Regulatory Filing Types
INSERT INTO lookup_values (category, code, display_value, sort_order) VALUES
('FILING_TYPE', 'CBE_30',              'Changes Being Effected in 30 Days (CBE-30)',  1),
('FILING_TYPE', 'CBE_0',               'Changes Being Effected (CBE-0)',               2),
('FILING_TYPE', 'PAS',                 'Prior Approval Supplement (PAS)',               3),
('FILING_TYPE', 'ANNUAL_REPORT',       'Annual Report',                                4),
('FILING_TYPE', 'VARIATION_TYPE_IA',   'Type IA Variation',                            5),
('FILING_TYPE', 'VARIATION_TYPE_IB',   'Type IB Variation',                            6),
('FILING_TYPE', 'VARIATION_TYPE_II',   'Type II Variation',                            7);

-- Sequence counters initialization
INSERT INTO sequence_counters (sequence_name, year, current_value, prefix, format_pattern) VALUES
('CAPA',            2025, 0, 'CAPA', '{PREFIX}-{YEAR}-{SEQ:3}'),
('DEVIATION',       2025, 0, 'DEV',  '{PREFIX}-{YEAR}-{SEQ:3}'),
('CHANGE_CONTROL',  2025, 0, 'CC',   '{PREFIX}-{YEAR}-{SEQ:3}'),
('CAPA',            2026, 0, 'CAPA', '{PREFIX}-{YEAR}-{SEQ:3}'),
('DEVIATION',       2026, 0, 'DEV',  '{PREFIX}-{YEAR}-{SEQ:3}'),
('CHANGE_CONTROL',  2026, 0, 'CC',   '{PREFIX}-{YEAR}-{SEQ:3}');