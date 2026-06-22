-- ============================================================================
-- V6: Seed Lookup Data & Reference Data for All QMS Modules
-- Fixes D6 (Risk dropdowns blocked) and provides lookup/reference data
-- for all scaffold modules that currently have no data.
-- ============================================================================

-- ============================================================================
-- 1. RISK MANAGEMENT LOOKUP VALUES
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- Risk Types
('RISK_TYPE', 'PRODUCT',        'Product Risk',          'Risk to product quality',              1),
('RISK_TYPE', 'PROCESS',        'Process Risk',          'Risk from manufacturing processes',     2),
('RISK_TYPE', 'PATIENT_SAFETY', 'Patient Safety Risk',   'Risk to patient safety',               3),
('RISK_TYPE', 'SUPPLY_CHAIN',   'Supply Chain Risk',     'Risk from supply chain',               4),
('RISK_TYPE', 'REGULATORY',     'Regulatory Risk',       'Risk of regulatory non-compliance',    5),
('RISK_TYPE', 'DATA_INTEGRITY', 'Data Integrity Risk',   'Risk to data integrity (ALCOA+)',      6),
('RISK_TYPE', 'ENVIRONMENTAL',  'Environmental Risk',    'Risk from environmental conditions',   7),
('RISK_TYPE', 'EQUIPMENT',      'Equipment Risk',        'Risk from equipment failure',          8),

-- Risk Methodologies
('RISK_METHODOLOGY', 'FMEA',    'FMEA',                       'Failure Mode & Effect Analysis',        1),
('RISK_METHODOLOGY', 'HACCP',   'HACCP',                       'Hazard Analysis & Critical Control',    2),
('RISK_METHODOLOGY', 'FTA',     'Fault Tree Analysis',         'Fault Tree Analysis',                   3),
('RISK_METHODOLOGY', 'HAZOP',   'HAZOP',                       'Hazard and Operability Study',          4),
('RISK_METHODOLOGY', 'PHA',     'Preliminary Hazard Analysis', 'Preliminary Hazard Analysis',           5),
('RISK_METHODOLOGY', 'BOW_TIE', 'Bow-Tie Analysis',           'Bow-Tie Risk Assessment',               6),
('RISK_METHODOLOGY', 'RISK_RANKING', 'Risk Ranking Matrix',   'Qualitative risk ranking matrix',       7),

-- Risk Categories (for assessments)
('RISK_CATEGORY', 'QUALITY',       'Quality',             'Product quality risk',          1),
('RISK_CATEGORY', 'SAFETY',        'Safety',              'Patient/operator safety risk',  2),
('RISK_CATEGORY', 'COMPLIANCE',    'Compliance',          'Regulatory compliance risk',    3),
('RISK_CATEGORY', 'OPERATIONAL',   'Operational',         'Operational/business risk',     4),
('RISK_CATEGORY', 'ENVIRONMENTAL', 'Environmental',       'Environmental impact risk',     5);

-- ============================================================================
-- 2. AUDIT MANAGEMENT LOOKUP VALUES
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- Audit Types
('AUDIT_TYPE', 'INTERNAL',          'Internal Audit',        'Routine internal GMP audit',                  1),
('AUDIT_TYPE', 'EXTERNAL',          'External Audit',        'Customer or third-party audit',               2),
('AUDIT_TYPE', 'SUPPLIER',          'Supplier Audit',        'Supplier qualification audit',                3),
('AUDIT_TYPE', 'REGULATORY',        'Regulatory Inspection', 'FDA/WHO/CDSCO inspection',                   4),
('AUDIT_TYPE', 'SELF_INSPECTION',   'Self-Inspection',       'Self-inspection per Schedule M',              5),
('AUDIT_TYPE', 'FOR_CAUSE',         'For-Cause Audit',       'Audit triggered by quality event',            6),

-- Audit Finding Classifications
('FINDING_CLASSIFICATION', 'CRITICAL',      'Critical',     'Poses immediate risk to product/patient',  1),
('FINDING_CLASSIFICATION', 'MAJOR',         'Major',        'Significant GMP non-compliance',           2),
('FINDING_CLASSIFICATION', 'MINOR',         'Minor',        'Minor non-compliance, low risk',           3),
('FINDING_CLASSIFICATION', 'OBSERVATION',   'Observation',  'Improvement opportunity',                  4),
('FINDING_CLASSIFICATION', 'COMMENDATION',  'Commendation', 'Noteworthy practice',                     5),

-- Audit Statuses
('AUDIT_STATUS', 'PLANNED',      'Planned',        'Audit scheduled',                    1),
('AUDIT_STATUS', 'IN_PROGRESS',  'In Progress',    'Audit being conducted',              2),
('AUDIT_STATUS', 'REPORT_DRAFT', 'Report Draft',   'Audit report under preparation',     3),
('AUDIT_STATUS', 'REVIEW',       'Under Review',   'Audit report under review',          4),
('AUDIT_STATUS', 'CLOSED',       'Closed',         'Audit completed and closed',         5);

-- ============================================================================
-- 3. SUPPLIER QUALITY LOOKUP VALUES
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- Supplier Types
('SUPPLIER_TYPE', 'API',         'API Manufacturer',       'Active Pharmaceutical Ingredient supplier', 1),
('SUPPLIER_TYPE', 'EXCIPIENT',   'Excipient Supplier',     'Pharmaceutical excipient supplier',         2),
('SUPPLIER_TYPE', 'PACKAGING',   'Packaging Material',     'Packaging material supplier',               3),
('SUPPLIER_TYPE', 'EQUIPMENT',   'Equipment Vendor',       'Manufacturing equipment vendor',            4),
('SUPPLIER_TYPE', 'SERVICE',     'Service Provider',       'Calibration, testing, consulting',          5),
('SUPPLIER_TYPE', 'CDMO',        'Contract Manufacturer',  'Contract development/manufacturing',        6),
('SUPPLIER_TYPE', 'CRO',         'Contract Research',      'Contract research organization',            7),
('SUPPLIER_TYPE', 'LABORATORY',  'Contract Laboratory',    'Contract analytical testing',               8),

-- Supplier Risk Tiers
('SUPPLIER_RISK_TIER', 'CRITICAL', 'Critical',   'Sole-source or high-impact supplier',  1),
('SUPPLIER_RISK_TIER', 'HIGH',     'High',       'High-impact, limited alternatives',    2),
('SUPPLIER_RISK_TIER', 'MEDIUM',   'Medium',     'Moderate impact, alternatives exist',  3),
('SUPPLIER_RISK_TIER', 'LOW',      'Low',        'Low impact, easily replaceable',       4),

-- Supplier Qualification Status
('SUPPLIER_QUAL_STATUS', 'PENDING',     'Pending Qualification',  'Awaiting qualification',       1),
('SUPPLIER_QUAL_STATUS', 'QUALIFIED',   'Qualified',              'Fully qualified supplier',     2),
('SUPPLIER_QUAL_STATUS', 'CONDITIONAL', 'Conditionally Approved', 'Approved with conditions',     3),
('SUPPLIER_QUAL_STATUS', 'SUSPENDED',   'Suspended',              'Qualification suspended',      4),
('SUPPLIER_QUAL_STATUS', 'DISQUALIFIED','Disqualified',           'No longer approved',           5);

-- ============================================================================
-- 4. COMPLAINT MANAGEMENT LOOKUP VALUES
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- Complaint Types
('COMPLAINT_TYPE', 'PRODUCT_QUALITY',   'Product Quality',       'Defect in finished product',        1),
('COMPLAINT_TYPE', 'PACKAGING',         'Packaging Defect',      'Packaging or labeling issue',       2),
('COMPLAINT_TYPE', 'EFFICACY',          'Efficacy',              'Reduced or no therapeutic effect',  3),
('COMPLAINT_TYPE', 'ADVERSE_EVENT',     'Adverse Event',         'Adverse drug reaction reported',    4),
('COMPLAINT_TYPE', 'CONTAMINATION',     'Contamination',         'Foreign particle or contamination', 5),
('COMPLAINT_TYPE', 'STABILITY',         'Stability Failure',     'Degradation before expiry',         6),
('COMPLAINT_TYPE', 'COUNTERFEIT',       'Suspected Counterfeit', 'Suspected counterfeit product',     7),
('COMPLAINT_TYPE', 'DOCUMENTATION',     'Documentation',         'Missing or incorrect documents',    8),

-- Complaint Severity
('COMPLAINT_SEVERITY', 'CRITICAL',  'Critical',   'Life-threatening or serious AE',       1),
('COMPLAINT_SEVERITY', 'MAJOR',     'Major',       'Significant product defect',           2),
('COMPLAINT_SEVERITY', 'MINOR',     'Minor',       'Minor cosmetic or packaging issue',    3),

-- AE Reportability
('AE_REPORTABILITY', 'REPORTABLE_15DAY', '15-Day Alert Report',  'Serious/unexpected AE - 15 day',  1),
('AE_REPORTABILITY', 'REPORTABLE_PERIODIC', 'Periodic Report',   'Expected AE - periodic report',   2),
('AE_REPORTABILITY', 'NON_REPORTABLE',  'Non-Reportable',        'Not a reportable event',          3);

-- ============================================================================
-- 5. NONCONFORMANCE MANAGEMENT LOOKUP VALUES
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- NC Types
('NC_TYPE', 'MATERIAL',       'Material Nonconformance',    'Raw material or API out of spec',       1),
('NC_TYPE', 'PRODUCT',        'Product Nonconformance',     'Finished product out of spec',          2),
('NC_TYPE', 'PACKAGING',      'Packaging Nonconformance',   'Packaging material defect',             3),
('NC_TYPE', 'INTERMEDIATE',   'In-Process Nonconformance',  'Intermediate product out of spec',      4),

-- NC Disposition Decisions
('NC_DISPOSITION', 'USE_AS_IS',         'Use As-Is',         'Accept material/product as-is with justification',  1),
('NC_DISPOSITION', 'REWORK',            'Rework',            'Rework per approved procedure',                      2),
('NC_DISPOSITION', 'REPROCESS',         'Reprocess',         'Reprocess through manufacturing steps',              3),
('NC_DISPOSITION', 'REJECT',            'Reject',            'Reject and dispose per SOP',                         4),
('NC_DISPOSITION', 'RETURN_TO_VENDOR',  'Return to Vendor',  'Return to supplier',                                 5),
('NC_DISPOSITION', 'SCRAP',             'Scrap',             'Destroy per waste disposal SOP',                     6);

-- ============================================================================
-- 6. EQUIPMENT & CALIBRATION LOOKUP VALUES
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- Equipment Types
('EQUIPMENT_TYPE', 'MANUFACTURING',   'Manufacturing Equipment', 'Tablet press, FBD, mixer etc.',          1),
('EQUIPMENT_TYPE', 'LABORATORY',      'Laboratory Equipment',    'HPLC, dissolution, balance etc.',        2),
('EQUIPMENT_TYPE', 'UTILITY',         'Utility System',          'HVAC, water system, compressed air',     3),
('EQUIPMENT_TYPE', 'PACKAGING',       'Packaging Equipment',     'Blister, bottle filling etc.',           4),
('EQUIPMENT_TYPE', 'STORAGE',         'Storage Equipment',       'Cold rooms, warehouses',                 5),
('EQUIPMENT_TYPE', 'CLEANING',        'Cleaning Equipment',      'CIP/COP, washers',                      6),

-- Equipment Qualification Status
('EQUIPMENT_QUAL_STATUS', 'NOT_QUALIFIED',  'Not Qualified',    'Pending qualification',         1),
('EQUIPMENT_QUAL_STATUS', 'IQ_COMPLETE',    'IQ Complete',      'Installation Qualification done',2),
('EQUIPMENT_QUAL_STATUS', 'OQ_COMPLETE',    'OQ Complete',      'Operational Qualification done', 3),
('EQUIPMENT_QUAL_STATUS', 'PQ_COMPLETE',    'PQ Complete',      'Performance Qualification done', 4),
('EQUIPMENT_QUAL_STATUS', 'QUALIFIED',      'Fully Qualified',  'All qualifications complete',    5),
('EQUIPMENT_QUAL_STATUS', 'RETIRED',        'Retired',          'Equipment decommissioned',       6),

-- Calibration Types
('CALIBRATION_TYPE', 'SCHEDULED',      'Scheduled Calibration',    'Routine periodic calibration',   1),
('CALIBRATION_TYPE', 'AFTER_REPAIR',   'Post-Repair Calibration',  'Calibration after equipment repair', 2),
('CALIBRATION_TYPE', 'VERIFICATION',   'Performance Verification', 'Intermediate PV check',          3),
('CALIBRATION_TYPE', 'SPECIAL',        'Special Calibration',      'Non-routine calibration',        4),

-- Maintenance Types
('MAINTENANCE_TYPE', 'PREVENTIVE',  'Preventive Maintenance',  'Scheduled PM per plan',           1),
('MAINTENANCE_TYPE', 'CORRECTIVE',  'Corrective Maintenance',  'Repair after failure/breakdown',  2),
('MAINTENANCE_TYPE', 'EMERGENCY',   'Emergency Maintenance',   'Urgent unplanned repair',         3),
('MAINTENANCE_TYPE', 'PREDICTIVE',  'Predictive Maintenance',  'Condition-based maintenance',     4);

-- ============================================================================
-- 7. DOCUMENT CONTROL LOOKUP VALUES
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- Document Types
('DOCUMENT_TYPE', 'SOP',         'Standard Operating Procedure',  'Step-by-step operational procedure',   1),
('DOCUMENT_TYPE', 'WI',          'Work Instruction',              'Detailed task instruction',            2),
('DOCUMENT_TYPE', 'FORM',        'Form/Template',                 'Data collection form or template',     3),
('DOCUMENT_TYPE', 'SPEC',        'Specification',                 'Product or material specification',    4),
('DOCUMENT_TYPE', 'MBR',         'Master Batch Record',           'Manufacturing batch record template',  5),
('DOCUMENT_TYPE', 'BMR',         'Batch Manufacturing Record',    'Executed batch record',                6),
('DOCUMENT_TYPE', 'PROTOCOL',    'Protocol',                      'Validation/study protocol',            7),
('DOCUMENT_TYPE', 'REPORT',      'Report',                        'Investigation/validation report',      8),
('DOCUMENT_TYPE', 'POLICY',      'Policy',                        'Quality policy document',              9),
('DOCUMENT_TYPE', 'MANUAL',      'Quality Manual',                'Quality system manual',               10),

-- Document Categories
('DOCUMENT_CATEGORY', 'QUALITY',       'Quality',          'QA/QC documents',           1),
('DOCUMENT_CATEGORY', 'PRODUCTION',    'Production',       'Manufacturing documents',   2),
('DOCUMENT_CATEGORY', 'LABORATORY',    'Laboratory',       'Analytical documents',      3),
('DOCUMENT_CATEGORY', 'ENGINEERING',   'Engineering',      'Engineering/maintenance',   4),
('DOCUMENT_CATEGORY', 'REGULATORY',    'Regulatory',       'Regulatory affairs',        5),
('DOCUMENT_CATEGORY', 'WAREHOUSE',     'Warehouse',        'Storage & distribution',    6),
('DOCUMENT_CATEGORY', 'TRAINING',      'Training',         'Training documents',        7),
('DOCUMENT_CATEGORY', 'SAFETY',        'Safety',           'EHS documents',             8);

-- ============================================================================
-- 8. TRAINING MANAGEMENT LOOKUP VALUES
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- Training Types
('TRAINING_TYPE', 'CLASSROOM',     'Classroom Training',       'Instructor-led classroom',         1),
('TRAINING_TYPE', 'ON_THE_JOB',    'On-the-Job Training',      'Supervised practical training',    2),
('TRAINING_TYPE', 'E_LEARNING',    'E-Learning',               'Computer-based training',          3),
('TRAINING_TYPE', 'READ_ACKNOWLEDGE', 'Read & Acknowledge',    'Document read & sign-off',         4),
('TRAINING_TYPE', 'ASSESSMENT',    'Assessment Only',          'Competency assessment',            5),
('TRAINING_TYPE', 'EXTERNAL',      'External Training',        'External course or seminar',       6),

-- Training Status
('TRAINING_STATUS', 'NOT_STARTED',  'Not Started',     'Training not yet begun',        1),
('TRAINING_STATUS', 'IN_PROGRESS',  'In Progress',     'Training underway',             2),
('TRAINING_STATUS', 'COMPLETED',    'Completed',       'Training completed',            3),
('TRAINING_STATUS', 'OVERDUE',      'Overdue',         'Past due date',                 4),
('TRAINING_STATUS', 'WAIVED',       'Waived',          'Training requirement waived',   5);

-- ============================================================================
-- 9. CHANGE CONTROL ADDITIONAL LOOKUPS
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- Change Categories
('CHANGE_CATEGORY', 'TEMPORARY',  'Temporary Change',   'Time-limited change with reversion date',  1),
('CHANGE_CATEGORY', 'PERMANENT',  'Permanent Change',   'Permanent change to current state',        2),
('CHANGE_CATEGORY', 'EMERGENCY',  'Emergency Change',   'Urgent change requiring expedited review', 3),

-- Change Classifications
('CHANGE_CLASSIFICATION', 'MINOR',  'Minor',    'Low impact, no regulatory filing needed',       1),
('CHANGE_CLASSIFICATION', 'MAJOR',  'Major',    'Significant impact, may require filing',        2),
('CHANGE_CLASSIFICATION', 'CRITICAL','Critical', 'High impact, regulatory filing required',      3);

-- ============================================================================
-- 10. PRODUCTS - Sample products for Mechatron Pharma
-- ============================================================================

INSERT INTO products (id, product_name, product_code, dosage_form, strength, plant_site_id, is_active) VALUES
('e0000000-0000-0000-0000-000000000001', 'Paracetamol 500mg Tablets',   'PARA-500',  'Tablet',      '500mg',  'b0000000-0000-0000-0000-000000000001', TRUE),
('e0000000-0000-0000-0000-000000000002', 'Metformin 500mg Tablets',     'MET-500',   'Tablet',      '500mg',  'b0000000-0000-0000-0000-000000000001', TRUE),
('e0000000-0000-0000-0000-000000000003', 'Amoxicillin 250mg Capsules',  'AMOX-250',  'Capsule',     '250mg',  'b0000000-0000-0000-0000-000000000001', TRUE),
('e0000000-0000-0000-0000-000000000004', 'Ibuprofen 400mg Tablets',     'IBU-400',   'Tablet',      '400mg',  'b0000000-0000-0000-0000-000000000001', TRUE),
('e0000000-0000-0000-0000-000000000005', 'Omeprazole 20mg Capsules',    'OME-20',    'Capsule',     '20mg',   'b0000000-0000-0000-0000-000000000001', TRUE),
('e0000000-0000-0000-0000-000000000006', 'Cetirizine 10mg Tablets',     'CET-10',    'Tablet',      '10mg',   'b0000000-0000-0000-0000-000000000001', TRUE),
('e0000000-0000-0000-0000-000000000007', 'Azithromycin 500mg Tablets',  'AZI-500',   'Tablet',      '500mg',  'b0000000-0000-0000-0000-000000000001', TRUE),
('e0000000-0000-0000-0000-000000000008', 'Injectable Formulations',     'INJ-GEN',   'Injection',   'Various','b0000000-0000-0000-0000-000000000001', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. SAMPLE EQUIPMENT (for Equipment & Calibration module)
-- ============================================================================

INSERT INTO equipment (id, equipment_number, name, description, equipment_type, category, model_number, serial_number,
    manufacturer, area, room_number, department_id, plant_site_id, qualification_status, status,
    calibration_required, gxp_relevant, created_by, updated_by) VALUES
('f0000000-0000-0000-0000-000000000001', 'EQP-2026-001', 'Fluid Bed Dryer FBD-03',
 'Fluid bed dryer for granulation drying', 'MANUFACTURING', 'CRITICAL', 'FBD-300', 'FBD-SN-2020-045',
 'ACG Pam Pharma', 'Production Block A', '101',
 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'FULLY_QUALIFIED', 'ACTIVE', FALSE, TRUE,
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f0000000-0000-0000-0000-000000000002', 'EQP-2026-002', 'Tablet Press TP-03',
 'Rotary tablet compression machine - 45 station', 'MANUFACTURING', 'CRITICAL', 'TP-45D', 'TP-SN-2021-112',
 'Cadmach Machinery', 'Production Block A', '103',
 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'FULLY_QUALIFIED', 'ACTIVE', FALSE, TRUE,
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f0000000-0000-0000-0000-000000000003', 'EQP-2026-003', 'HPLC System HPLC-05',
 'High Performance Liquid Chromatography system', 'LABORATORY', 'CRITICAL', 'Alliance e2695', 'HPLC-SN-2022-078',
 'Waters Corporation', 'QC Lab', '205',
 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 'FULLY_QUALIFIED', 'ACTIVE', TRUE, TRUE,
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f0000000-0000-0000-0000-000000000004', 'EQP-2026-004', 'Dissolution Apparatus DA-02',
 'USP Apparatus II (Paddle) 8-station dissolution', 'LABORATORY', 'MAJOR', 'DT-800', 'DA-SN-2021-034',
 'Electrolab', 'QC Lab', '206',
 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 'FULLY_QUALIFIED', 'ACTIVE', TRUE, TRUE,
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f0000000-0000-0000-0000-000000000005', 'EQP-2026-005', 'Analytical Balance AB-08',
 'Precision analytical balance 0.01mg readability', 'LABORATORY', 'CRITICAL', 'XPR205', 'AB-SN-2023-015',
 'Mettler Toledo', 'QC Lab', '207',
 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 'FULLY_QUALIFIED', 'ACTIVE', TRUE, TRUE,
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f0000000-0000-0000-0000-000000000006', 'EQP-2026-006', 'Purified Water System PW-01',
 'Reverse osmosis + EDI purified water generation system', 'UTILITY', 'CRITICAL', 'PW-5000', 'PW-SN-2019-001',
 'Thermax', 'Utility Block', 'U-01',
 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
 'FULLY_QUALIFIED', 'ACTIVE', FALSE, TRUE,
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f0000000-0000-0000-0000-000000000007', 'EQP-2026-007', 'HVAC AHU-03',
 'Air handling unit for Production Block A', 'UTILITY', 'MAJOR', 'AHU-2000', 'AHU-SN-2020-003',
 'Blue Star', 'Utility Block', 'Terrace',
 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
 'FULLY_QUALIFIED', 'ACTIVE', FALSE, TRUE,
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f0000000-0000-0000-0000-000000000008', 'EQP-2026-008', 'Refrigeration Unit RU-CSR-02',
 'Cold storage room refrigeration unit 2-8°C', 'STORAGE', 'MAJOR', 'CSR-500', 'RU-SN-2021-002',
 'Daikin', 'Warehouse', 'CSR-02',
 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001',
 'FULLY_QUALIFIED', 'UNDER_MAINTENANCE', FALSE, TRUE,
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. SAMPLE SUPPLIERS (for Supplier Quality module)
-- ============================================================================

INSERT INTO suppliers (id, supplier_number, name, supplier_type, category, status,
    address, city, state, country, primary_contact_name, primary_contact_email, primary_contact_phone,
    owner_id, plant_site_id, created_by, updated_by) VALUES
('f1000000-0000-0000-0000-000000000001', 'SUP-2026-001', 'Aurobindo API Division',
 'API', 'CRITICAL', 'QUALIFIED',
 'Survey No. 71, Bachupally', 'Hyderabad', 'Telangana', 'India',
 'Dr. Ramana Reddy', 'ramana.reddy@aurobindoapi.com', '+91-40-44556677',
 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f1000000-0000-0000-0000-000000000002', 'SUP-2026-002', 'DFE Pharma India',
 'EXCIPIENT', 'MAJOR', 'QUALIFIED',
 'Unit 6, Pharma City', 'Visakhapatnam', 'Andhra Pradesh', 'India',
 'Sunil Mehta', 'sunil.mehta@dfepharma.in', '+91-891-2345678',
 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f1000000-0000-0000-0000-000000000003', 'SUP-2026-003', 'MK Chemicals',
 'EXCIPIENT', 'MINOR', 'QUALIFIED',
 '34/A Ambattur Industrial Estate', 'Chennai', 'Tamil Nadu', 'India',
 'Murali Krishnan', 'murali@mkchemicals.co.in', '+91-44-34567890',
 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f1000000-0000-0000-0000-000000000004', 'SUP-2026-004', 'Roquette India Pvt Ltd',
 'EXCIPIENT', 'MAJOR', 'QUALIFIED',
 'SEZ Pharma Zone, Kandla', 'Gandhidham', 'Gujarat', 'India',
 'Pradeep Jain', 'pradeep.jain@roquette.com', '+91-2836-234567',
 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('f1000000-0000-0000-0000-000000000005', 'SUP-2026-005', 'ACG Pam Packaging',
 'PACKAGING', 'MINOR', 'QUALIFIED',
 'Unit 12, MIDC Shirwal', 'Satara', 'Maharashtra', 'India',
 'Ashish Patil', 'ashish.patil@acg-world.com', '+91-2167-234567',
 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. ADDITIONAL LOOKUP VALUES FOR EXISTING MODULES
-- ============================================================================

INSERT INTO lookup_values (category, code, display_value, description, sort_order) VALUES
-- Deviation Types (supplements existing data)
('DEVIATION_TYPE', 'UNPLANNED', 'Unplanned Deviation',  'Unexpected event or failure',            1),
('DEVIATION_TYPE', 'PLANNED',   'Planned Deviation',    'Pre-approved temporary change',          2),

-- Deviation Classifications
('DEVIATION_CLASSIFICATION', 'CRITICAL', 'Critical',  'Poses immediate risk to product/patient', 1),
('DEVIATION_CLASSIFICATION', 'MAJOR',    'Major',     'Significant impact on quality',           2),
('DEVIATION_CLASSIFICATION', 'MINOR',    'Minor',     'Minimal impact, low risk',                3),

-- CAPA Types
('CAPA_TYPE', 'CORRECTIVE',                'Corrective',              'Corrective action only',                1),
('CAPA_TYPE', 'PREVENTIVE',                'Preventive',              'Preventive action only',                2),
('CAPA_TYPE', 'BOTH',                      'Corrective & Preventive', 'Both corrective and preventive',        3),

-- CAPA Priorities
('CAPA_PRIORITY', 'CRITICAL',  'Critical',  'Immediate action required',     1),
('CAPA_PRIORITY', 'HIGH',      'High',      'Urgent, address within 7 days', 2),
('CAPA_PRIORITY', 'MEDIUM',    'Medium',    'Standard priority',             3),
('CAPA_PRIORITY', 'LOW',       'Low',       'Address when feasible',         4),

-- Impact Levels (for deviation impact assessment)
('IMPACT_LEVEL', 'NONE',     'None',     'No impact',      1),
('IMPACT_LEVEL', 'LOW',      'Low',      'Low impact',     2),
('IMPACT_LEVEL', 'MEDIUM',   'Medium',   'Medium impact',  3),
('IMPACT_LEVEL', 'HIGH',     'High',     'High impact',    4),
('IMPACT_LEVEL', 'CRITICAL', 'Critical', 'Critical impact',5),

-- Disposition Decisions (for deviations)
('DISPOSITION_DECISION', 'RELEASE',                'Release',                       'Release batch with no restrictions',         1),
('DISPOSITION_DECISION', 'RELEASE_WITH_CONDITIONS', 'Release with Conditions',      'Release with conditions attached',           2),
('DISPOSITION_DECISION', 'REJECT',                 'Reject',                        'Reject the batch',                           3),
('DISPOSITION_DECISION', 'QUARANTINE',             'Quarantine',                    'Hold in quarantine pending further review',  4),
('DISPOSITION_DECISION', 'REPROCESS',              'Reprocess',                     'Reprocess per approved procedure',           5),
('DISPOSITION_DECISION', 'REWORK',                 'Rework',                        'Rework to meet specifications',              6)
ON CONFLICT DO NOTHING;