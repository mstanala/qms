-- ============================================================
-- V7: Audit table enhancements + sample audit seed data
-- ============================================================

-- 1. Add missing columns to audits table
ALTER TABLE audits ADD COLUMN IF NOT EXISTS category          VARCHAR(50);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS executive_summary TEXT;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS findings_summary  TEXT;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS frequency         VARCHAR(30) CHECK (frequency IN (
    'ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'FOR_CAUSE', 'ONE_TIME'
));
ALTER TABLE audits ADD COLUMN IF NOT EXISTS proposed_action   TEXT;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS lifecycle_state   VARCHAR(30) DEFAULT 'DRAFT' CHECK (lifecycle_state IN (
    'DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'APPROVED', 'SUPERSEDED', 'RETIRED'
));

-- 2. Seed: Audit Plans
INSERT INTO audit_plans (id, plan_number, title, description, plan_year, audit_type, status, owner_id, plant_site_id, created_by, updated_by) VALUES
('e1000000-0000-0000-0000-000000000001', 'AP-2026-001', 'Annual Internal GMP Audit Plan 2026',
 'Comprehensive internal audit plan covering all GMP areas for Hyderabad Unit-1 per Schedule M requirements.',
 2026, 'INTERNAL', 'APPROVED',
 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

('e1000000-0000-0000-0000-000000000002', 'AP-2026-002', 'Supplier Qualification Audit Plan Q1-Q2 2026',
 'Planned supplier qualification audits for critical raw material suppliers.',
 2026, 'SUPPLIER', 'IN_PROGRESS',
 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003');

-- 3. Seed: Audits (8 records with all columns populated)
INSERT INTO audits (
    id, audit_number, audit_plan_id, title, description, audit_type, audit_scope, status, priority,
    category, executive_summary, findings_summary, frequency, proposed_action, lifecycle_state,
    scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, report_due_date,
    lead_auditor_id, auditee_department_id, auditee_contact_id, plant_site_id, area_audited,
    standards_reference, current_workflow_step, created_by, updated_by
) VALUES
-- AUD-001: Completed internal GMP audit
('e2000000-0000-0000-0000-000000000001', 'AUD-2026-001', 'e1000000-0000-0000-0000-000000000001',
 'Q1 Internal GMP Audit - Production Block A',
 'Routine quarterly internal GMP audit of Production Block A covering manufacturing, packaging, and in-process controls. Audit conducted per SOP-QA-042 Rev.3.',
 'INTERNAL',
 'Manufacturing area (Granulation, Compression, Coating), Packaging area (Primary & Secondary), In-process QC lab, Equipment qualification records, Batch documentation for Jan-Mar 2026.',
 'COMPLETED', 'HIGH',
 'GMP Compliance',
 'The Q1 audit of Production Block A identified 2 major and 3 minor findings. Key concerns include incomplete equipment cleaning validation for Tablet Press TP-05 and gaps in batch record review timelines. Overall GMP compliance is satisfactory with targeted improvements needed in documentation practices.',
 '2 Major findings, 3 Minor findings, 1 Observation. Major: Cleaning validation gaps for TP-05, Batch record review delays exceeding 5 working days. Minor: Incomplete logbook entries, Missing calibration sticker on balance WB-12, SOP training gap for 2 operators.',
 'QUARTERLY',
 'Initiate CAPA for cleaning validation gaps. Implement batch record review tracking dashboard. Conduct refresher training for production operators on documentation practices. Re-calibrate and label balance WB-12 immediately.',
 'APPROVED',
 '2026-01-15T09:00:00Z', '2026-01-18T17:00:00Z', '2026-01-15T09:00:00Z', '2026-01-17T17:00:00Z', '2026-01-25T17:00:00Z',
 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004',
 'b0000000-0000-0000-0000-000000000001', 'Production Block A - Granulation, Compression, Coating, Packaging',
 'Schedule M (Revised), ICH Q7, WHO TRS 986 Annex 2', 'Closed',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

-- AUD-002: In-progress QC lab audit
('e2000000-0000-0000-0000-000000000002', 'AUD-2026-002', 'e1000000-0000-0000-0000-000000000001',
 'Q1 Internal Audit - Quality Control Laboratory',
 'Internal audit of QC laboratory operations including analytical methods, instrument qualification, stability studies, OOS/OOT handling, and data integrity practices.',
 'INTERNAL',
 'Analytical testing (HPLC, Dissolution, Karl Fischer), Instrument qualification (IQ/OQ/PQ), Stability chamber monitoring, OOS investigation procedures, Electronic data management, Reference standard handling.',
 'IN_PROGRESS', 'HIGH',
 'Laboratory Compliance',
 'Audit is currently in progress. Preliminary observations indicate strong analytical method compliance but potential gaps in electronic data integrity controls for standalone HPLC systems.',
 NULL,
 'QUARTERLY',
 NULL,
 'ACTIVE',
 '2026-03-10T09:00:00Z', '2026-03-14T17:00:00Z', '2026-03-10T09:00:00Z', NULL, '2026-03-21T17:00:00Z',
 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000009',
 'b0000000-0000-0000-0000-000000000001', 'QC Laboratory - Analytical Lab, Instrumentation Room, Stability Area',
 '21 CFR Part 211, ICH Q2(R2), WHO TRS 1010 Annex 3, ALCOA+ Principles', 'In Progress',
 'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003'),

-- AUD-003: Planned warehouse audit
('e2000000-0000-0000-0000-000000000003', 'AUD-2026-003', 'e1000000-0000-0000-0000-000000000001',
 'Q2 Internal Audit - Warehouse & Storage Operations',
 'Planned audit of warehouse operations including material receipt, storage conditions, inventory management, dispensing practices, and cold chain compliance.',
 'INTERNAL',
 'Receiving bay, Quarantine area, Approved storage, Cold storage rooms (CSR-01, CSR-02), Dispensing booth, Rejected material cage, Shipping dock.',
 'PLANNED', 'MEDIUM',
 'Storage & Distribution',
 NULL,
 NULL,
 'QUARTERLY',
 NULL,
 'DRAFT',
 '2026-04-14T09:00:00Z', '2026-04-17T17:00:00Z', NULL, NULL, '2026-04-25T17:00:00Z',
 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000007',
 'b0000000-0000-0000-0000-000000000001', 'Warehouse - Receiving, Storage, Cold Chain, Dispensing',
 'Schedule M (Revised), WHO GSP Guidelines, ICH Q1A Stability', 'Planning',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

-- AUD-004: Supplier audit completed
('e2000000-0000-0000-0000-000000000004', 'AUD-2026-004', 'e1000000-0000-0000-0000-000000000002',
 'Supplier Audit - MK Chemicals Pvt Ltd (API Supplier)',
 'On-site supplier qualification audit of MK Chemicals for Metformin HCl API supply. Audit covers manufacturing, QC, storage, and regulatory compliance at their Vizag facility.',
 'SUPPLIER',
 'API manufacturing process, QC testing and release, Stability program, Impurity profiling, Change control system, Deviation and CAPA management, Storage and distribution, Regulatory filing status (DMF/CEP).',
 'COMPLETED', 'HIGH',
 'Supplier Qualification',
 'MK Chemicals demonstrates adequate GMP compliance for API manufacturing. Their QC capability is strong with modern instrumentation. Two major findings relate to incomplete change control documentation and gaps in annual product quality review. Supplier is conditionally approved pending CAPA closure.',
 '2 Major findings, 1 Minor finding. Major: Incomplete change control records for process parameter changes in last 12 months. Annual Product Quality Review not completed for 2 of 5 products. Minor: Temperature mapping of API storage not updated after HVAC modification.',
 'ANNUAL',
 'Issue conditional approval with 90-day CAPA timeline. Re-audit change control system in 6 months. Request updated temperature mapping report within 30 days. Add to enhanced monitoring program.',
 'APPROVED',
 '2026-02-05T09:00:00Z', '2026-02-07T17:00:00Z', '2026-02-05T09:00:00Z', '2026-02-07T17:00:00Z', '2026-02-15T17:00:00Z',
 'd0000000-0000-0000-0000-000000000003', NULL, NULL,
 'b0000000-0000-0000-0000-000000000003', 'Supplier Site - MK Chemicals, Vizag',
 'ICH Q7, WHO TRS 986 Annex 2, Schedule M', 'Closed',
 'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003'),

-- AUD-005: Regulatory inspection prep (self-inspection)
('e2000000-0000-0000-0000-000000000005', 'AUD-2026-005', NULL,
 'Pre-FDA Inspection Self-Inspection - Full Site',
 'Comprehensive self-inspection in preparation for anticipated US FDA inspection. Covers all systems: Quality, Production, Laboratory, Materials, Facilities & Equipment, Packaging & Labeling.',
 'SELF_INSPECTION',
 'All six FDA systems: Quality System, Production System, Laboratory Controls, Materials System, Facilities & Equipment, Packaging & Labeling. Includes data integrity assessment, computer system validation review, and complaint handling.',
 'REPORT_DRAFTING', 'CRITICAL',
 'Regulatory Readiness',
 'Self-inspection revealed overall satisfactory compliance with some critical gaps in computer system validation documentation and data integrity controls for legacy systems. Production and Quality systems show strong compliance. Immediate attention needed for CSV documentation of 3 standalone systems.',
 '1 Critical finding, 3 Major findings, 4 Minor findings, 2 Observations. Critical: CSV documentation incomplete for 3 standalone laboratory systems. Major: Annual product review backlog for 4 products, Complaint trending analysis not current, Equipment qualification overdue for 2 units.',
 'FOR_CAUSE',
 'Priority CAPA for CSV documentation gaps. Expedite annual product reviews within 45 days. Update complaint trending through current quarter. Schedule overdue equipment qualifications within 30 days. Conduct mock FDA inspection with external consultant.',
 'UNDER_REVIEW',
 '2026-03-01T09:00:00Z', '2026-03-08T17:00:00Z', '2026-03-01T09:00:00Z', '2026-03-07T17:00:00Z', '2026-03-15T17:00:00Z',
 'd0000000-0000-0000-0000-000000000001', NULL, NULL,
 'b0000000-0000-0000-0000-000000000001', 'Full Site - All Areas',
 '21 CFR Part 211, 21 CFR Part 11, FDA Compliance Program 7356.002, ICH Q10', 'Report Drafting',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

-- AUD-006: External customer audit
('e2000000-0000-0000-0000-000000000006', 'AUD-2026-006', NULL,
 'Customer Audit - PharmaCo Europe GmbH',
 'External audit by PharmaCo Europe as part of contract manufacturing qualification. Focus on manufacturing capability, quality systems, and regulatory compliance for EU market supply.',
 'EXTERNAL',
 'Quality Management System overview, Manufacturing capability for oral solid dosage, Analytical method validation, Stability program, Deviation and CAPA system, Change control, Supplier management, Training program.',
 'SCHEDULED', 'HIGH',
 'Customer Qualification',
 NULL,
 NULL,
 'ANNUAL',
 NULL,
 'ACTIVE',
 '2026-04-22T09:00:00Z', '2026-04-24T17:00:00Z', NULL, NULL, '2026-05-02T17:00:00Z',
 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003',
 'b0000000-0000-0000-0000-000000000001', 'Full Site - Manufacturing, QC, QA, Warehouse',
 'EU GMP Annex 16, ICH Q7, EU GDP Guidelines', 'Scheduled',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

-- AUD-007: For-cause audit triggered by deviation
('e2000000-0000-0000-0000-000000000007', 'AUD-2026-007', NULL,
 'For-Cause Audit - Cold Storage Failure Investigation',
 'Targeted audit triggered by critical deviation DEV-2026-001 (temperature excursion in Cold Storage Room CSR-02). Audit scope limited to cold chain management, equipment maintenance, and alarm system validation.',
 'INTERNAL',
 'Cold storage rooms CSR-01 and CSR-02, Temperature monitoring system, Alarm configuration and testing records, Preventive maintenance program for refrigeration units, Cold chain product handling SOPs.',
 'UNDER_REVIEW', 'CRITICAL',
 'For-Cause Investigation',
 'For-cause audit confirmed systemic gaps in cold storage equipment maintenance program. Preventive maintenance was overdue for 3 of 4 refrigeration units. Alarm system configuration was not part of change control after software updates. CAPA-2025-001 addresses immediate corrective actions but broader preventive measures needed.',
 '1 Critical finding, 2 Major findings. Critical: PM program for cold storage equipment not followed per schedule - 3 units overdue. Major: Alarm threshold configuration not managed under change control. Cold chain qualification protocol not updated after room renovation in 2025.',
 'FOR_CAUSE',
 'Overhaul PM scheduling system with automated alerts. Include alarm configuration in change control SOP. Requalify cold storage rooms with updated protocol. Implement real-time temperature monitoring dashboard with SMS/email alerts.',
 'UNDER_REVIEW',
 '2026-02-20T09:00:00Z', '2026-02-22T17:00:00Z', '2026-02-20T09:00:00Z', '2026-02-22T17:00:00Z', '2026-03-01T17:00:00Z',
 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000007',
 'b0000000-0000-0000-0000-000000000001', 'Cold Storage Area - CSR-01, CSR-02, Monitoring Room',
 'WHO TRS 961 Annex 9, Schedule M, ICH Q1A', 'Under Review',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),

-- AUD-008: CDSCO regulatory inspection
('e2000000-0000-0000-0000-000000000008', 'AUD-2026-008', NULL,
 'CDSCO Schedule M Compliance Inspection',
 'Regulatory inspection by CDSCO officials for Revised Schedule M compliance assessment. This is a mandatory inspection following the 2024 Schedule M revision for all licensed manufacturing units.',
 'REGULATORY_INSPECTION',
 'Premises and plant, Equipment, Personnel and training, Documentation system, Production operations, Quality control, Self-inspection program, Complaint and recall procedures, Contract manufacture and analysis.',
 'PLANNED', 'CRITICAL',
 'Regulatory Inspection',
 NULL,
 NULL,
 'ONE_TIME',
 'Prepare all Schedule M documentation packages. Conduct pre-inspection readiness assessment. Assign department-wise CDSCO liaison officers. Prepare facility tour route. Compile last 2 years quality metrics.',
 'DRAFT',
 '2026-05-12T09:00:00Z', '2026-05-14T17:00:00Z', NULL, NULL, NULL,
 'd0000000-0000-0000-0000-000000000001', NULL, NULL,
 'b0000000-0000-0000-0000-000000000001', 'Full Site - All Areas per Schedule M Chapters',
 'Drugs and Cosmetics Act, Revised Schedule M (2024), CDSCO Guidelines', 'Planning',
 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001');

-- 4. Seed: Audit Findings for completed audits
INSERT INTO audit_findings (id, audit_id, finding_number, title, description, classification, area, standard_reference, objective_evidence, status, response_due_date, auditee_response, capa_required) VALUES
-- Findings for AUD-001
('e3000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001', 'FND-2026-001',
 'Cleaning Validation Gap - Tablet Press TP-05',
 'Cleaning validation protocol for Tablet Press TP-05 does not include worst-case product (Carvedilol 25mg) introduced in Q4 2025. Current validation covers only 3 of 5 products manufactured on this equipment.',
 'MAJOR', 'Production - Compression', 'Schedule M Chapter 5, ICH Q7 Section 12',
 'Reviewed cleaning validation master plan (CVMP-2025-Rev2). Carvedilol 25mg not included despite being manufactured since Oct 2025. Batch records BN-CAR-2025-003 through 007 show use of TP-05.',
 'CAPA_ASSIGNED', '2026-02-15T17:00:00Z', 'Accepted. Cleaning validation protocol update initiated. Worst-case assessment being revised to include Carvedilol.', true),

('e3000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000001', 'FND-2026-002',
 'Batch Record Review Delays',
 'Batch record review by QA is not completed within the SOP-defined timeline of 5 working days. Review of 15 batch records from Jan 2026 showed 8 records (53%) reviewed beyond 5 working days, with delays ranging from 7 to 12 working days.',
 'MAJOR', 'Quality Assurance', 'Schedule M Chapter 6, 21 CFR 211.192',
 'QA batch review log reviewed for Jan 2026. 8/15 records exceeded 5-day SOP limit. QA-BR-2026-005 took 12 working days. No documented justification for delays.',
 'CAPA_ASSIGNED', '2026-02-15T17:00:00Z', 'Acknowledged. Root cause: QA reviewer shortage during Jan due to 2 staff on leave. Additional reviewer assigned.', true),

('e3000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000001', 'FND-2026-003',
 'Incomplete Equipment Logbook Entries',
 'Equipment usage logbook for Fluid Bed Dryer FBD-02 had 3 missing entries for usage dates in January 2026. Operators confirmed verbal handover but failed to log entries.',
 'MINOR', 'Production - Granulation', 'Schedule M Chapter 5',
 'Logbook FBD-02/2026 reviewed. Missing entries for Jan 8, Jan 15, and Jan 22. Cross-referenced with batch records confirmed equipment was in use.',
 'IN_PROGRESS', '2026-02-01T17:00:00Z', 'Entries back-filled with deviation reference. Refresher training scheduled.', false),

-- Findings for AUD-004 (Supplier audit)
('e3000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000004', 'FND-2026-004',
 'Incomplete Change Control Documentation',
 'Change control records for process parameter changes in Metformin HCl manufacturing showed 4 of 7 change requests with incomplete impact assessments. Regulatory impact not assessed for 3 changes that affected validated parameters.',
 'MAJOR', 'Quality Systems - Change Control', 'ICH Q7 Section 13',
 'Change control register reviewed for last 12 months. CC-MK-2025-011, 013, 015, 018 had incomplete impact assessments. CC-MK-2025-013 changed drying temperature without regulatory impact evaluation.',
 'CAPA_ASSIGNED', '2026-03-07T17:00:00Z', 'MK Chemicals accepted finding. Implementing enhanced change control checklist with mandatory regulatory impact assessment.', true),

('e3000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000004', 'FND-2026-005',
 'Annual Product Quality Review Backlog',
 'APQR not completed for 2 out of 5 commercial API products for the year 2025. Metformin HCl APQR in draft stage, Atorvastatin Calcium APQR not initiated.',
 'MAJOR', 'Quality Assurance', 'ICH Q7 Section 2.5, Schedule M',
 'APQR tracking register showed Metformin HCl APQR at 60% draft, Atorvastatin Calcium APQR not started. Due date was Dec 31, 2025.',
 'IN_PROGRESS', '2026-03-07T17:00:00Z', 'Both APQRs being expedited. Metformin APQR to be completed by Feb 28, Atorvastatin by Mar 15.', false),

-- Findings for AUD-005 (Self-inspection)
('e3000000-0000-0000-0000-000000000006', 'e2000000-0000-0000-0000-000000000005', 'FND-2026-006',
 'CSV Documentation Incomplete for Standalone Systems',
 'Computer System Validation documentation is incomplete for 3 standalone laboratory systems: HPLC Data System (Empower 3), UV-Vis Spectrophotometer software, and Dissolution workstation software. IQ/OQ documentation exists but PQ and periodic review not completed.',
 'CRITICAL', 'Quality Control - Data Integrity', '21 CFR Part 11, EU GMP Annex 11, GAMP 5',
 'CSV master list reviewed. 3 systems classified as GxP-critical missing PQ documentation. Last periodic review for Empower was 2023. User access reviews not documented for any system.',
 'CAPA_ASSIGNED', '2026-04-01T17:00:00Z', NULL, true),

-- Findings for AUD-007 (For-cause)
('e3000000-0000-0000-0000-000000000007', 'e2000000-0000-0000-0000-000000000007', 'FND-2026-007',
 'Preventive Maintenance Overdue for Cold Storage Units',
 'Preventive maintenance schedule for cold storage refrigeration units not followed. 3 of 4 units had overdue PM: RU-CSR-01 (2 weeks overdue), RU-CSR-02 (3 weeks overdue - unit that failed), RU-CSR-03 (1 week overdue).',
 'CRITICAL', 'Engineering - Cold Storage', 'Schedule M, WHO TRS 961 Annex 9',
 'PM schedule tracker reviewed. RU-CSR-02 PM was due Dec 28, 2025 - not performed. Work order WO-2025-PM-892 cancelled without rescheduling.',
 'CAPA_ASSIGNED', '2026-03-15T17:00:00Z', 'All overdue PMs completed. PM scheduling system being overhauled with automated reminders.', true);

-- 5. Seed: Audit Team Members
INSERT INTO audit_team_members (audit_id, user_id, role) VALUES
('e2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'LEAD_AUDITOR'),
('e2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'AUDITOR'),
('e2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000009', 'AUDITOR'),
('e2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'LEAD_AUDITOR'),
('e2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000011', 'AUDITOR'),
('e2000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'LEAD_AUDITOR'),
('e2000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'AUDITOR'),
('e2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'LEAD_AUDITOR'),
('e2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'AUDITOR'),
('e2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000009', 'AUDITOR'),
('e2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000011', 'TECHNICAL_EXPERT'),
('e2000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'LEAD_AUDITOR'),
('e2000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004', 'TECHNICAL_EXPERT');