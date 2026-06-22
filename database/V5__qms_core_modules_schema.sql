-- ============================================================================
-- V5: QMS Core Modules Schema - Risk, Audit, Supplier, Complaint,
--     Nonconformance, Equipment/Calibration, Validation, Management Review,
--     Regulatory Commitments
-- ============================================================================
-- Follows same conventions as V1: UUID PKs, TIMESTAMPTZ dates, CHECK constraints,
-- Flowable integration, audit/workflow support, 21 CFR Part 11 ready.
-- ============================================================================

-- Expand shared tables to support new record types
ALTER TABLE electronic_signatures DROP CONSTRAINT IF EXISTS electronic_signatures_record_type_check;
ALTER TABLE electronic_signatures ADD CONSTRAINT electronic_signatures_record_type_check
    CHECK (record_type IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT', 'TRAINING',
        'RISK_ASSESSMENT', 'AUDIT', 'SUPPLIER', 'COMPLAINT', 'NONCONFORMANCE',
        'EQUIPMENT', 'VALIDATION', 'MANAGEMENT_REVIEW', 'REGULATORY_COMMITMENT'
    ));

ALTER TABLE audit_trail DROP CONSTRAINT IF EXISTS audit_trail_record_type_check;
ALTER TABLE audit_trail ADD CONSTRAINT audit_trail_record_type_check
    CHECK (record_type IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'USER', 'ROLE',
        'DOCUMENT', 'TRAINING', 'SYSTEM_CONFIG',
        'RISK_ASSESSMENT', 'AUDIT', 'SUPPLIER', 'COMPLAINT', 'NONCONFORMANCE',
        'EQUIPMENT', 'CALIBRATION', 'VALIDATION', 'MANAGEMENT_REVIEW', 'REGULATORY_COMMITMENT'
    ));

ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS workflow_history_record_type_check;
ALTER TABLE workflow_history ADD CONSTRAINT workflow_history_record_type_check
    CHECK (record_type IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT',
        'RISK_ASSESSMENT', 'AUDIT', 'SUPPLIER', 'COMPLAINT', 'NONCONFORMANCE',
        'EQUIPMENT', 'VALIDATION', 'MANAGEMENT_REVIEW'
    ));

ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_record_type_check;
ALTER TABLE attachments ADD CONSTRAINT attachments_record_type_check
    CHECK (record_type IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT', 'TRAINING',
        'RISK_ASSESSMENT', 'AUDIT', 'SUPPLIER', 'COMPLAINT', 'NONCONFORMANCE',
        'EQUIPMENT', 'CALIBRATION', 'VALIDATION', 'MANAGEMENT_REVIEW', 'REGULATORY_COMMITMENT'
    ));

ALTER TABLE record_comments DROP CONSTRAINT IF EXISTS record_comments_record_type_check;
ALTER TABLE record_comments ADD CONSTRAINT record_comments_record_type_check
    CHECK (record_type IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL',
        'RISK_ASSESSMENT', 'AUDIT', 'SUPPLIER', 'COMPLAINT', 'NONCONFORMANCE',
        'EQUIPMENT', 'VALIDATION', 'MANAGEMENT_REVIEW', 'REGULATORY_COMMITMENT'
    ));

ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_module_check;
ALTER TABLE permissions ADD CONSTRAINT permissions_module_check
    CHECK (module IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT', 'TRAINING',
        'AUDIT', 'ADMIN', 'REPORT',
        'RISK', 'SUPPLIER', 'COMPLAINT', 'NONCONFORMANCE',
        'EQUIPMENT', 'VALIDATION', 'MANAGEMENT_REVIEW', 'REGULATORY'
    ));

-- ============================================================================
-- 1. RISK MANAGEMENT
-- ============================================================================

CREATE TABLE risk_registers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_number         VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    risk_type               VARCHAR(30) NOT NULL CHECK (risk_type IN (
        'PRODUCT_QUALITY', 'PATIENT_SAFETY', 'PROCESS', 'COMPLIANCE',
        'SUPPLY_CHAIN', 'EQUIPMENT', 'ENVIRONMENTAL', 'DATA_INTEGRITY'
    )),
    methodology             VARCHAR(30) NOT NULL CHECK (methodology IN (
        'FMEA', 'HACCP', 'RISK_MATRIX', 'FAULT_TREE', 'BOW_TIE', 'HAZOP'
    )),
    scope                   TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'APPROVED', 'CLOSED', 'SUPERSEDED'
    )),
    priority                VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    owner_id                UUID NOT NULL REFERENCES users(id),
    department_id           UUID NOT NULL REFERENCES departments(id),
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    review_frequency_months INTEGER DEFAULT 12,
    next_review_date        TIMESTAMPTZ,
    last_review_date        TIMESTAMPTZ,
    approved_by_id          UUID REFERENCES users(id),
    approved_date           TIMESTAMPTZ,
    current_workflow_step   VARCHAR(100) DEFAULT 'Draft',
    flowable_process_id     VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_risk_reg_status ON risk_registers(status);
CREATE INDEX idx_risk_reg_owner ON risk_registers(owner_id);
CREATE INDEX idx_risk_reg_plant ON risk_registers(plant_site_id);

CREATE TABLE risk_assessments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_register_id        UUID NOT NULL REFERENCES risk_registers(id) ON DELETE CASCADE,
    assessment_number       VARCHAR(50) NOT NULL UNIQUE,
    hazard_description      TEXT NOT NULL,
    harm_description        TEXT,
    risk_category           VARCHAR(50),
    process_step            VARCHAR(255),
    -- Initial Risk Scoring
    initial_severity        INTEGER NOT NULL CHECK (initial_severity >= 1 AND initial_severity <= 5),
    initial_occurrence      INTEGER NOT NULL CHECK (initial_occurrence >= 1 AND initial_occurrence <= 5),
    initial_detectability   INTEGER NOT NULL CHECK (initial_detectability >= 1 AND initial_detectability <= 5),
    initial_rpn             INTEGER GENERATED ALWAYS AS (initial_severity * initial_occurrence * initial_detectability) STORED,
    initial_risk_level      VARCHAR(20) NOT NULL CHECK (initial_risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    -- Residual Risk Scoring (after controls)
    residual_severity       INTEGER CHECK (residual_severity >= 1 AND residual_severity <= 5),
    residual_occurrence     INTEGER CHECK (residual_occurrence >= 1 AND residual_occurrence <= 5),
    residual_detectability  INTEGER CHECK (residual_detectability >= 1 AND residual_detectability <= 5),
    residual_rpn            INTEGER GENERATED ALWAYS AS (residual_severity * residual_occurrence * residual_detectability) STORED,
    residual_risk_level     VARCHAR(20) CHECK (residual_risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    -- Risk Decision
    risk_acceptance         VARCHAR(30) CHECK (risk_acceptance IN ('ACCEPTABLE', 'ALARP', 'UNACCEPTABLE', 'PENDING')),
    justification           TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'IDENTIFIED' CHECK (status IN (
        'IDENTIFIED', 'ASSESSED', 'CONTROLS_DEFINED', 'CONTROLS_IMPLEMENTED',
        'VERIFIED', 'ACCEPTED', 'CLOSED', 'ESCALATED'
    )),
    assessed_by_id          UUID REFERENCES users(id),
    assessed_date           TIMESTAMPTZ,
    -- Cross-Module Links
    linked_capa_id          UUID REFERENCES capas(id),
    linked_deviation_id     UUID REFERENCES deviations(id),
    linked_change_id        UUID REFERENCES change_requests(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_risk_assess_register ON risk_assessments(risk_register_id);
CREATE INDEX idx_risk_assess_status ON risk_assessments(status);
CREATE INDEX idx_risk_assess_level ON risk_assessments(initial_risk_level);

CREATE TABLE risk_controls (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_assessment_id      UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    control_number          VARCHAR(50) NOT NULL,
    control_type            VARCHAR(30) NOT NULL CHECK (control_type IN (
        'PREVENTIVE', 'DETECTIVE', 'CORRECTIVE', 'DESIGN', 'PROCEDURAL', 'MONITORING'
    )),
    description             TEXT NOT NULL,
    responsible_id          UUID REFERENCES users(id),
    implementation_date     TIMESTAMPTZ,
    verification_date       TIMESTAMPTZ,
    effectiveness_rating    VARCHAR(20) CHECK (effectiveness_rating IN ('EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'NOT_EFFECTIVE', 'NOT_VERIFIED')),
    status                  VARCHAR(20) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'IMPLEMENTED', 'VERIFIED', 'INEFFECTIVE')),
    evidence                TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_ctrl_assessment ON risk_controls(risk_assessment_id);

CREATE TABLE risk_reviews (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_register_id        UUID NOT NULL REFERENCES risk_registers(id) ON DELETE CASCADE,
    review_date             TIMESTAMPTZ NOT NULL,
    reviewer_id             UUID NOT NULL REFERENCES users(id),
    review_outcome          VARCHAR(30) NOT NULL CHECK (review_outcome IN (
        'NO_CHANGE', 'RISK_INCREASED', 'RISK_DECREASED', 'NEW_RISKS_IDENTIFIED', 'CONTROLS_UPDATED'
    )),
    summary                 TEXT NOT NULL,
    next_review_date        TIMESTAMPTZ,
    approved_by_id          UUID REFERENCES users(id),
    approved_date           TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. AUDIT MANAGEMENT
-- ============================================================================

CREATE TABLE audit_plans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_number             VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    plan_year               INTEGER NOT NULL,
    audit_type              VARCHAR(30) NOT NULL CHECK (audit_type IN (
        'INTERNAL', 'EXTERNAL', 'SUPPLIER', 'REGULATORY_INSPECTION', 'SELF_INSPECTION'
    )),
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
    owner_id                UUID NOT NULL REFERENCES users(id),
    department_id           UUID REFERENCES departments(id),
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    approved_by_id          UUID REFERENCES users(id),
    approved_date           TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_audit_plan_year ON audit_plans(plan_year);
CREATE INDEX idx_audit_plan_status ON audit_plans(status);

CREATE TABLE audits (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_number            VARCHAR(50) NOT NULL UNIQUE,
    audit_plan_id           UUID REFERENCES audit_plans(id),
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    audit_type              VARCHAR(30) NOT NULL CHECK (audit_type IN (
        'INTERNAL', 'EXTERNAL', 'SUPPLIER', 'REGULATORY_INSPECTION', 'SELF_INSPECTION'
    )),
    audit_scope             TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PLANNED' CHECK (status IN (
        'PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'REPORT_DRAFTING',
        'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'
    )),
    priority                VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    -- Dates
    scheduled_start_date    TIMESTAMPTZ NOT NULL,
    scheduled_end_date      TIMESTAMPTZ NOT NULL,
    actual_start_date       TIMESTAMPTZ,
    actual_end_date         TIMESTAMPTZ,
    report_due_date         TIMESTAMPTZ,
    -- People
    lead_auditor_id         UUID NOT NULL REFERENCES users(id),
    auditee_department_id   UUID REFERENCES departments(id),
    auditee_contact_id      UUID REFERENCES users(id),
    -- Location
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    area_audited            VARCHAR(500),
    -- Supplier (for supplier audits)
    supplier_id             UUID,
    -- Standards
    standards_reference     TEXT,
    -- Workflow
    current_workflow_step   VARCHAR(100) DEFAULT 'Planning',
    flowable_process_id     VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_audit_status ON audits(status);
CREATE INDEX idx_audit_type ON audits(audit_type);
CREATE INDEX idx_audit_lead ON audits(lead_auditor_id);
CREATE INDEX idx_audit_plant ON audits(plant_site_id);
CREATE INDEX idx_audit_dates ON audits(scheduled_start_date, scheduled_end_date);

CREATE TABLE audit_team_members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id            UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    role                VARCHAR(50) NOT NULL CHECK (role IN ('LEAD_AUDITOR', 'AUDITOR', 'OBSERVER', 'TECHNICAL_EXPERT', 'TRAINEE_AUDITOR')),
    UNIQUE (audit_id, user_id)
);

CREATE TABLE audit_checklists (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id                UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    checklist_number        VARCHAR(50) NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    section                 VARCHAR(255),
    standard_reference      VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_checklist_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id            UUID NOT NULL REFERENCES audit_checklists(id) ON DELETE CASCADE,
    item_number             INTEGER NOT NULL,
    question                TEXT NOT NULL,
    expected_evidence       TEXT,
    response                VARCHAR(30) CHECK (response IN ('CONFORMING', 'NON_CONFORMING', 'OBSERVATION', 'NOT_APPLICABLE', 'NOT_ASSESSED')),
    evidence_found          TEXT,
    auditor_notes           TEXT,
    sort_order              INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE audit_findings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id                UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    finding_number          VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    classification          VARCHAR(20) NOT NULL CHECK (classification IN ('CRITICAL', 'MAJOR', 'MINOR', 'OBSERVATION', 'OFI')),
    area                    VARCHAR(255),
    standard_reference      VARCHAR(255),
    objective_evidence      TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'CAPA_ASSIGNED', 'IN_PROGRESS', 'VERIFICATION', 'CLOSED'
    )),
    response_due_date       TIMESTAMPTZ,
    auditee_response        TEXT,
    -- CAPA Link
    capa_required           BOOLEAN NOT NULL DEFAULT FALSE,
    capa_id                 UUID REFERENCES capas(id),
    -- Verification
    verified_by_id          UUID REFERENCES users(id),
    verified_date           TIMESTAMPTZ,
    verification_comments   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_findings_audit ON audit_findings(audit_id);
CREATE INDEX idx_audit_findings_class ON audit_findings(classification);
CREATE INDEX idx_audit_findings_status ON audit_findings(status);

-- ============================================================================
-- 3. SUPPLIER QUALITY MANAGEMENT
-- ============================================================================

CREATE TABLE suppliers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_number         VARCHAR(50) NOT NULL UNIQUE,
    name                    VARCHAR(500) NOT NULL,
    legal_name              VARCHAR(500),
    supplier_type           VARCHAR(30) NOT NULL CHECK (supplier_type IN (
        'RAW_MATERIAL', 'PACKAGING', 'EXCIPIENT', 'API',
        'CONTRACT_MANUFACTURER', 'CONTRACT_LAB', 'SERVICE_PROVIDER', 'EQUIPMENT'
    )),
    category                VARCHAR(30) NOT NULL CHECK (category IN ('CRITICAL', 'MAJOR', 'MINOR')),
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING_QUALIFICATION' CHECK (status IN (
        'PENDING_QUALIFICATION', 'QUALIFIED', 'APPROVED', 'CONDITIONALLY_APPROVED',
        'SUSPENDED', 'DISQUALIFIED', 'INACTIVE'
    )),
    -- Contact Info
    address                 TEXT,
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    country                 VARCHAR(100),
    postal_code             VARCHAR(20),
    primary_contact_name    VARCHAR(255),
    primary_contact_email   VARCHAR(255),
    primary_contact_phone   VARCHAR(50),
    -- Quality Info
    gmp_certification       VARCHAR(100),
    iso_certification       VARCHAR(100),
    fda_registration        VARCHAR(100),
    duns_number             VARCHAR(20),
    -- Qualification
    qualification_date      TIMESTAMPTZ,
    next_requalification_date TIMESTAMPTZ,
    requalification_frequency_months INTEGER DEFAULT 36,
    -- Scoring
    overall_score           DECIMAL(5,2),
    quality_score           DECIMAL(5,2),
    delivery_score          DECIMAL(5,2),
    compliance_score        DECIMAL(5,2),
    -- Owner
    owner_id                UUID NOT NULL REFERENCES users(id),
    plant_site_id           UUID REFERENCES plant_sites(id),
    -- Workflow
    current_workflow_step   VARCHAR(100) DEFAULT 'Pending',
    flowable_process_id     VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_supplier_status ON suppliers(status);
CREATE INDEX idx_supplier_type ON suppliers(supplier_type);
CREATE INDEX idx_supplier_category ON suppliers(category);
CREATE INDEX idx_supplier_owner ON suppliers(owner_id);

CREATE TABLE supplier_qualifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id             UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    qualification_number    VARCHAR(50) NOT NULL UNIQUE,
    qualification_type      VARCHAR(30) NOT NULL CHECK (qualification_type IN (
        'INITIAL', 'REQUALIFICATION', 'SCOPE_EXTENSION', 'REINSTATEMENT'
    )),
    status                  VARCHAR(30) NOT NULL DEFAULT 'INITIATED' CHECK (status IN (
        'INITIATED', 'QUESTIONNAIRE_SENT', 'DOCUMENTS_RECEIVED', 'UNDER_REVIEW',
        'AUDIT_PLANNED', 'AUDIT_COMPLETED', 'APPROVED', 'REJECTED'
    )),
    initiated_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_date          TIMESTAMPTZ,
    decision                VARCHAR(20) CHECK (decision IN ('APPROVED', 'CONDITIONALLY_APPROVED', 'REJECTED')),
    decision_date           TIMESTAMPTZ,
    decision_by_id          UUID REFERENCES users(id),
    conditions              TEXT,
    validity_months         INTEGER DEFAULT 36,
    expiry_date             TIMESTAMPTZ,
    reviewer_id             UUID REFERENCES users(id),
    audit_id                UUID REFERENCES audits(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_supq_supplier ON supplier_qualifications(supplier_id);
CREATE INDEX idx_supq_status ON supplier_qualifications(status);

CREATE TABLE supplier_scorecards (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id             UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    evaluation_period_start DATE NOT NULL,
    evaluation_period_end   DATE NOT NULL,
    quality_score           DECIMAL(5,2) NOT NULL,
    delivery_score          DECIMAL(5,2) NOT NULL,
    responsiveness_score    DECIMAL(5,2) NOT NULL,
    compliance_score        DECIMAL(5,2) NOT NULL,
    overall_score           DECIMAL(5,2) NOT NULL,
    comments                TEXT,
    evaluated_by_id         UUID NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supsc_supplier ON supplier_scorecards(supplier_id);

CREATE TABLE supplier_materials (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id             UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    material_name           VARCHAR(500) NOT NULL,
    material_code           VARCHAR(100),
    material_type           VARCHAR(50),
    specification_number    VARCHAR(100),
    approval_status         VARCHAR(20) DEFAULT 'APPROVED' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. COMPLAINT MANAGEMENT
-- ============================================================================

CREATE TABLE complaints (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number        VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    complaint_type          VARCHAR(30) NOT NULL CHECK (complaint_type IN (
        'PRODUCT_QUALITY', 'ADVERSE_EVENT', 'PACKAGING', 'LABELING',
        'DELIVERY', 'DOCUMENTATION', 'COUNTERFEIT', 'OTHER'
    )),
    source                  VARCHAR(30) NOT NULL CHECK (source IN (
        'CUSTOMER', 'PATIENT', 'HCP', 'DISTRIBUTOR', 'REGULATORY_AGENCY',
        'INTERNAL', 'FIELD_ALERT', 'LITERATURE'
    )),
    classification          VARCHAR(20) CHECK (classification IN ('CRITICAL', 'MAJOR', 'MINOR')),
    status                  VARCHAR(30) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN (
        'RECEIVED', 'ACKNOWLEDGED', 'INVESTIGATION', 'ROOT_CAUSE_IDENTIFIED',
        'CAPA_INITIATED', 'PENDING_CLOSURE', 'CLOSED', 'REJECTED'
    )),
    priority                VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    -- Reporter Info
    reporter_name           VARCHAR(255),
    reporter_contact        VARCHAR(255),
    reporter_type           VARCHAR(30),
    received_date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Product Info
    product_name            VARCHAR(255),
    product_code            VARCHAR(100),
    batch_number            VARCHAR(100),
    expiry_date             DATE,
    quantity_affected       VARCHAR(100),
    -- Investigation
    investigation_required  BOOLEAN NOT NULL DEFAULT TRUE,
    investigator_id         UUID REFERENCES users(id),
    investigation_start     TIMESTAMPTZ,
    investigation_complete  TIMESTAMPTZ,
    root_cause              TEXT,
    conclusion              TEXT,
    -- Adverse Event
    is_adverse_event        BOOLEAN NOT NULL DEFAULT FALSE,
    adverse_event_reported  BOOLEAN DEFAULT FALSE,
    reporting_deadline      TIMESTAMPTZ,
    -- Regulatory
    regulatory_reportable   BOOLEAN NOT NULL DEFAULT FALSE,
    field_alert_required    BOOLEAN NOT NULL DEFAULT FALSE,
    recall_assessment       VARCHAR(30) CHECK (recall_assessment IN ('NOT_REQUIRED', 'UNDER_ASSESSMENT', 'RECALL_INITIATED', 'RECALL_COMPLETED')),
    -- Links
    capa_required           BOOLEAN NOT NULL DEFAULT FALSE,
    capa_id                 UUID REFERENCES capas(id),
    deviation_id            UUID REFERENCES deviations(id),
    -- Response
    response_due_date       TIMESTAMPTZ,
    response_sent_date      TIMESTAMPTZ,
    response_text           TEXT,
    -- Assignments
    owner_id                UUID NOT NULL REFERENCES users(id),
    department_id           UUID NOT NULL REFERENCES departments(id),
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    -- Workflow
    current_workflow_step   VARCHAR(100) DEFAULT 'Received',
    flowable_process_id     VARCHAR(255),
    closed_date             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_complaint_status ON complaints(status);
CREATE INDEX idx_complaint_type ON complaints(complaint_type);
CREATE INDEX idx_complaint_product ON complaints(product_code);
CREATE INDEX idx_complaint_batch ON complaints(batch_number);
CREATE INDEX idx_complaint_owner ON complaints(owner_id);
CREATE INDEX idx_complaint_plant ON complaints(plant_site_id);
CREATE INDEX idx_complaint_adverse ON complaints(is_adverse_event) WHERE is_adverse_event = TRUE;

CREATE TABLE complaint_samples (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id            UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    sample_number           VARCHAR(100) NOT NULL,
    sample_type             VARCHAR(50),
    received_date           TIMESTAMPTZ,
    condition_on_receipt    TEXT,
    testing_required        BOOLEAN DEFAULT FALSE,
    test_results            TEXT,
    disposition             VARCHAR(30) CHECK (disposition IN ('RETAINED', 'RETURNED', 'DESTROYED', 'TESTED'))
);

CREATE TABLE complaint_trending (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trend_period_start      DATE NOT NULL,
    trend_period_end        DATE NOT NULL,
    product_code            VARCHAR(100),
    complaint_type          VARCHAR(30),
    count                   INTEGER NOT NULL DEFAULT 0,
    trend_direction         VARCHAR(20) CHECK (trend_direction IN ('INCREASING', 'STABLE', 'DECREASING')),
    alert_threshold_met     BOOLEAN DEFAULT FALSE,
    analysis_notes          TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. NONCONFORMANCE MANAGEMENT
-- ============================================================================

CREATE TABLE nonconformances (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nc_number               VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    nc_type                 VARCHAR(30) NOT NULL CHECK (nc_type IN (
        'MATERIAL', 'IN_PROCESS', 'FINISHED_PRODUCT', 'PACKAGING',
        'EQUIPMENT', 'ENVIRONMENTAL', 'DOCUMENTATION', 'LABORATORY'
    )),
    classification          VARCHAR(20) CHECK (classification IN ('CRITICAL', 'MAJOR', 'MINOR')),
    status                  VARCHAR(30) NOT NULL DEFAULT 'IDENTIFIED' CHECK (status IN (
        'IDENTIFIED', 'QUARANTINED', 'UNDER_INVESTIGATION', 'DISPOSITION_PENDING',
        'DISPOSITION_APPROVED', 'IN_PROGRESS', 'CLOSED', 'REJECTED'
    )),
    priority                VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    -- Material/Product Info
    product_name            VARCHAR(255),
    product_code            VARCHAR(100),
    batch_number            VARCHAR(100),
    batch_size              VARCHAR(100),
    quantity_affected       VARCHAR(100),
    unit_of_measure         VARCHAR(50),
    -- Location
    detected_location       VARCHAR(255),
    stage_detected          VARCHAR(50) CHECK (stage_detected IN (
        'INCOMING', 'IN_PROCESS', 'FINAL_PRODUCT', 'STABILITY', 'MARKET'
    )),
    -- Disposition
    disposition_decision    VARCHAR(30) CHECK (disposition_decision IN (
        'RELEASE', 'RELEASE_WITH_CONDITIONS', 'REPROCESS', 'REWORK',
        'REJECT', 'RETURN_TO_SUPPLIER', 'DESTROY', 'USE_AS_IS'
    )),
    disposition_justification TEXT,
    disposition_approved_by UUID REFERENCES users(id),
    disposition_date        TIMESTAMPTZ,
    -- Hold Management
    hold_status             VARCHAR(20) DEFAULT 'NONE' CHECK (hold_status IN ('NONE', 'HOLD', 'RELEASED')),
    hold_location           VARCHAR(255),
    hold_initiated_date     TIMESTAMPTZ,
    hold_released_date      TIMESTAMPTZ,
    hold_released_by        UUID REFERENCES users(id),
    -- Links
    capa_required           BOOLEAN NOT NULL DEFAULT FALSE,
    capa_id                 UUID REFERENCES capas(id),
    deviation_id            UUID REFERENCES deviations(id),
    supplier_id             UUID REFERENCES suppliers(id),
    -- Assignments
    owner_id                UUID NOT NULL REFERENCES users(id),
    department_id           UUID NOT NULL REFERENCES departments(id),
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    -- Workflow
    current_workflow_step   VARCHAR(100) DEFAULT 'Identified',
    flowable_process_id     VARCHAR(255),
    closed_date             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_nc_status ON nonconformances(status);
CREATE INDEX idx_nc_type ON nonconformances(nc_type);
CREATE INDEX idx_nc_batch ON nonconformances(batch_number);
CREATE INDEX idx_nc_product ON nonconformances(product_code);
CREATE INDEX idx_nc_hold ON nonconformances(hold_status) WHERE hold_status = 'HOLD';
CREATE INDEX idx_nc_owner ON nonconformances(owner_id);
CREATE INDEX idx_nc_plant ON nonconformances(plant_site_id);

-- ============================================================================
-- 6. EQUIPMENT & CALIBRATION MANAGEMENT
-- ============================================================================

CREATE TABLE equipment (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_number        VARCHAR(50) NOT NULL UNIQUE,
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    equipment_type          VARCHAR(30) NOT NULL CHECK (equipment_type IN (
        'MANUFACTURING', 'LABORATORY', 'UTILITY', 'PACKAGING',
        'STORAGE', 'WEIGHING', 'HVAC', 'WATER_SYSTEM', 'OTHER'
    )),
    category                VARCHAR(30) NOT NULL CHECK (category IN ('CRITICAL', 'MAJOR', 'MINOR')),
    status                  VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'UNDER_CALIBRATION',
        'QUALIFIED', 'DECOMMISSIONED', 'OUT_OF_SERVICE'
    )),
    -- Identification
    manufacturer            VARCHAR(255),
    model_number            VARCHAR(100),
    serial_number           VARCHAR(100),
    asset_tag               VARCHAR(100),
    -- Location
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    department_id           UUID REFERENCES departments(id),
    area                    VARCHAR(255),
    room_number             VARCHAR(50),
    -- Dates
    installation_date       DATE,
    commissioning_date      DATE,
    qualification_date      DATE,
    next_qualification_date DATE,
    decommission_date       DATE,
    -- Qualification
    qualification_status    VARCHAR(30) CHECK (qualification_status IN (
        'NOT_QUALIFIED', 'IQ_COMPLETED', 'OQ_COMPLETED', 'PQ_COMPLETED',
        'FULLY_QUALIFIED', 'REQUALIFICATION_DUE', 'QUALIFICATION_EXPIRED'
    )),
    -- Calibration
    calibration_required    BOOLEAN NOT NULL DEFAULT FALSE,
    calibration_frequency_days INTEGER,
    last_calibration_date   DATE,
    next_calibration_date   DATE,
    calibration_status      VARCHAR(20) CHECK (calibration_status IN ('CALIBRATED', 'DUE', 'OVERDUE', 'NOT_APPLICABLE')),
    -- Maintenance
    maintenance_frequency_days INTEGER,
    last_maintenance_date   DATE,
    next_maintenance_date   DATE,
    -- Owner
    owner_id                UUID REFERENCES users(id),
    -- GxP
    gxp_relevant            BOOLEAN NOT NULL DEFAULT TRUE,
    computerized_system     BOOLEAN NOT NULL DEFAULT FALSE,
    data_integrity_class    VARCHAR(20) CHECK (data_integrity_class IN ('HIGH', 'MEDIUM', 'LOW', 'NOT_APPLICABLE')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_equip_status ON equipment(status);
CREATE INDEX idx_equip_type ON equipment(equipment_type);
CREATE INDEX idx_equip_plant ON equipment(plant_site_id);
CREATE INDEX idx_equip_cal_due ON equipment(next_calibration_date) WHERE calibration_required = TRUE;
CREATE INDEX idx_equip_maint_due ON equipment(next_maintenance_date);

CREATE TABLE calibration_records (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calibration_number      VARCHAR(50) NOT NULL UNIQUE,
    equipment_id            UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    calibration_type        VARCHAR(30) NOT NULL CHECK (calibration_type IN (
        'ROUTINE', 'INITIAL', 'POST_REPAIR', 'VERIFICATION', 'SPECIAL'
    )),
    status                  VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    scheduled_date          TIMESTAMPTZ NOT NULL,
    performed_date          TIMESTAMPTZ,
    performed_by_id         UUID REFERENCES users(id),
    -- Results
    result                  VARCHAR(20) CHECK (result IN ('PASS', 'FAIL', 'PASS_WITH_ADJUSTMENT', 'OUT_OF_TOLERANCE')),
    standard_used           VARCHAR(255),
    standard_certificate    VARCHAR(255),
    as_found_reading        TEXT,
    as_left_reading         TEXT,
    tolerance               VARCHAR(100),
    uncertainty             VARCHAR(100),
    adjustment_made         BOOLEAN DEFAULT FALSE,
    adjustment_details      TEXT,
    -- Review
    reviewed_by_id          UUID REFERENCES users(id),
    review_date             TIMESTAMPTZ,
    -- Next Due
    next_calibration_date   DATE,
    -- Impact
    impact_assessment_required BOOLEAN DEFAULT FALSE,
    impact_on_results       TEXT,
    deviation_id            UUID REFERENCES deviations(id),
    certificate_path        VARCHAR(1000),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cal_equipment ON calibration_records(equipment_id);
CREATE INDEX idx_cal_status ON calibration_records(status);
CREATE INDEX idx_cal_scheduled ON calibration_records(scheduled_date);

CREATE TABLE maintenance_records (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_number      VARCHAR(50) NOT NULL UNIQUE,
    equipment_id            UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    maintenance_type        VARCHAR(30) NOT NULL CHECK (maintenance_type IN (
        'PREVENTIVE', 'CORRECTIVE', 'BREAKDOWN', 'PREDICTIVE', 'CONDITION_BASED'
    )),
    status                  VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED', 'CANCELLED'
    )),
    priority                VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    scheduled_date          TIMESTAMPTZ NOT NULL,
    completed_date          TIMESTAMPTZ,
    performed_by_id         UUID REFERENCES users(id),
    work_performed          TEXT,
    parts_replaced          TEXT,
    next_maintenance_date   DATE,
    downtime_hours          DECIMAL(6,1),
    -- Impact
    impact_on_production    BOOLEAN DEFAULT FALSE,
    requalification_required BOOLEAN DEFAULT FALSE,
    deviation_id            UUID REFERENCES deviations(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maint_equipment ON maintenance_records(equipment_id);
CREATE INDEX idx_maint_status ON maintenance_records(status);
CREATE INDEX idx_maint_scheduled ON maintenance_records(scheduled_date);

-- ============================================================================
-- 7. VALIDATION MANAGEMENT
-- ============================================================================

CREATE TABLE validation_projects (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_number          VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    validation_type         VARCHAR(30) NOT NULL CHECK (validation_type IN (
        'PROCESS', 'CLEANING', 'METHOD', 'COMPUTER_SYSTEM', 'EQUIPMENT',
        'FACILITY', 'TRANSPORT', 'PACKAGING'
    )),
    status                  VARCHAR(30) NOT NULL DEFAULT 'PLANNING' CHECK (status IN (
        'PLANNING', 'PROTOCOL_DRAFTING', 'PROTOCOL_APPROVED', 'EXECUTION',
        'REPORT_DRAFTING', 'UNDER_REVIEW', 'APPROVED', 'MAINTAINED', 'RETIRED'
    )),
    priority                VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    -- Scope
    system_name             VARCHAR(255),
    process_name            VARCHAR(255),
    equipment_id            UUID REFERENCES equipment(id),
    product_id              UUID REFERENCES products(id),
    -- People
    owner_id                UUID NOT NULL REFERENCES users(id),
    department_id           UUID NOT NULL REFERENCES departments(id),
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    -- Dates
    planned_start_date      TIMESTAMPTZ,
    planned_end_date        TIMESTAMPTZ,
    actual_start_date       TIMESTAMPTZ,
    actual_end_date         TIMESTAMPTZ,
    -- Qualification Phases
    iq_status               VARCHAR(20) DEFAULT 'NOT_STARTED' CHECK (iq_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NOT_APPLICABLE')),
    oq_status               VARCHAR(20) DEFAULT 'NOT_STARTED' CHECK (oq_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NOT_APPLICABLE')),
    pq_status               VARCHAR(20) DEFAULT 'NOT_STARTED' CHECK (pq_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NOT_APPLICABLE')),
    -- Lifecycle
    revalidation_required   BOOLEAN DEFAULT FALSE,
    revalidation_frequency_months INTEGER,
    next_revalidation_date  TIMESTAMPTZ,
    -- Workflow
    current_workflow_step   VARCHAR(100) DEFAULT 'Planning',
    flowable_process_id     VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_val_status ON validation_projects(status);
CREATE INDEX idx_val_type ON validation_projects(validation_type);
CREATE INDEX idx_val_owner ON validation_projects(owner_id);
CREATE INDEX idx_val_plant ON validation_projects(plant_site_id);

CREATE TABLE validation_requirements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL REFERENCES validation_projects(id) ON DELETE CASCADE,
    requirement_number      VARCHAR(50) NOT NULL,
    requirement_type        VARCHAR(30) NOT NULL CHECK (requirement_type IN ('URS', 'FS', 'DS', 'CS')),
    title                   VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    priority                VARCHAR(20) CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    acceptance_criteria     TEXT,
    verification_method     VARCHAR(30) CHECK (verification_method IN ('TEST', 'INSPECTION', 'REVIEW', 'DEMONSTRATION')),
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'TESTED', 'PASSED', 'FAILED')),
    test_protocol_id        UUID,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, requirement_number)
);

CREATE TABLE validation_test_protocols (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL REFERENCES validation_projects(id) ON DELETE CASCADE,
    protocol_number         VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    phase                   VARCHAR(20) NOT NULL CHECK (phase IN ('IQ', 'OQ', 'PQ', 'REVALIDATION')),
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'UNDER_REVIEW', 'APPROVED', 'IN_EXECUTION', 'COMPLETED', 'FAILED'
    )),
    approved_by_id          UUID REFERENCES users(id),
    approved_date           TIMESTAMPTZ,
    executed_by_id          UUID REFERENCES users(id),
    execution_start_date    TIMESTAMPTZ,
    execution_end_date      TIMESTAMPTZ,
    result                  VARCHAR(20) CHECK (result IN ('PASS', 'FAIL', 'PASS_WITH_DEVIATIONS')),
    deviations_noted        TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE validation_test_cases (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id             UUID NOT NULL REFERENCES validation_test_protocols(id) ON DELETE CASCADE,
    test_case_number        VARCHAR(50) NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    test_description        TEXT NOT NULL,
    acceptance_criteria     TEXT NOT NULL,
    prerequisite            TEXT,
    test_data               TEXT,
    expected_result         TEXT NOT NULL,
    actual_result           TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'NOT_EXECUTED' CHECK (status IN ('NOT_EXECUTED', 'PASSED', 'FAILED', 'BLOCKED', 'DEFERRED')),
    executed_by_id          UUID REFERENCES users(id),
    executed_date           TIMESTAMPTZ,
    evidence_path           VARCHAR(1000),
    comments                TEXT,
    sort_order              INTEGER NOT NULL DEFAULT 0,
    UNIQUE (protocol_id, test_case_number)
);

CREATE TABLE validation_traceability (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID NOT NULL REFERENCES validation_projects(id) ON DELETE CASCADE,
    requirement_id          UUID NOT NULL REFERENCES validation_requirements(id),
    test_case_id            UUID REFERENCES validation_test_cases(id),
    protocol_id             UUID REFERENCES validation_test_protocols(id),
    trace_status            VARCHAR(20) CHECK (trace_status IN ('LINKED', 'TESTED', 'VERIFIED', 'GAP')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. MANAGEMENT REVIEW
-- ============================================================================

CREATE TABLE management_reviews (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_number           VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    review_type             VARCHAR(30) NOT NULL CHECK (review_type IN (
        'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'SPECIAL', 'TRIGGERED'
    )),
    status                  VARCHAR(30) NOT NULL DEFAULT 'PLANNED' CHECK (status IN (
        'PLANNED', 'AGENDA_PREPARATION', 'IN_PROGRESS', 'MINUTES_DRAFTING',
        'UNDER_REVIEW', 'APPROVED', 'CLOSED'
    )),
    -- Dates
    scheduled_date          TIMESTAMPTZ NOT NULL,
    actual_date             TIMESTAMPTZ,
    review_period_start     DATE NOT NULL,
    review_period_end       DATE NOT NULL,
    -- People
    chairperson_id          UUID NOT NULL REFERENCES users(id),
    secretary_id            UUID REFERENCES users(id),
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    -- Content
    agenda                  TEXT,
    minutes                 TEXT,
    decisions               TEXT,
    -- Approval
    approved_by_id          UUID REFERENCES users(id),
    approved_date           TIMESTAMPTZ,
    -- Workflow
    current_workflow_step   VARCHAR(100) DEFAULT 'Planning',
    flowable_process_id     VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_mgmt_rev_status ON management_reviews(status);
CREATE INDEX idx_mgmt_rev_date ON management_reviews(scheduled_date);

CREATE TABLE management_review_attendees (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id           UUID NOT NULL REFERENCES management_reviews(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    role                VARCHAR(50) NOT NULL CHECK (role IN ('CHAIRPERSON', 'SECRETARY', 'MEMBER', 'PRESENTER', 'OBSERVER')),
    attended            BOOLEAN DEFAULT FALSE,
    UNIQUE (review_id, user_id)
);

CREATE TABLE management_review_metrics (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id               UUID NOT NULL REFERENCES management_reviews(id) ON DELETE CASCADE,
    metric_category         VARCHAR(50) NOT NULL CHECK (metric_category IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'COMPLAINT', 'AUDIT',
        'SUPPLIER', 'TRAINING', 'NONCONFORMANCE', 'RISK', 'REGULATORY'
    )),
    metric_name             VARCHAR(255) NOT NULL,
    metric_value            DECIMAL(10,2),
    metric_target           DECIMAL(10,2),
    trend                   VARCHAR(20) CHECK (trend IN ('IMPROVING', 'STABLE', 'DECLINING')),
    comments                TEXT
);

CREATE TABLE management_review_actions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id               UUID NOT NULL REFERENCES management_reviews(id) ON DELETE CASCADE,
    action_number           VARCHAR(50) NOT NULL,
    description             TEXT NOT NULL,
    assigned_to_id          UUID NOT NULL REFERENCES users(id),
    due_date                TIMESTAMPTZ NOT NULL,
    priority                VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status                  VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    completed_date          TIMESTAMPTZ,
    completion_evidence     TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. REGULATORY COMMITMENTS & ACTIONS
-- ============================================================================

CREATE TABLE regulatory_inspections (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_number       VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    agency                  VARCHAR(100) NOT NULL,
    inspection_type         VARCHAR(30) NOT NULL CHECK (inspection_type IN (
        'ROUTINE', 'FOR_CAUSE', 'PRE_APPROVAL', 'POST_APPROVAL', 'SURVEILLANCE'
    )),
    status                  VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED', 'IN_PROGRESS', 'OBSERVATIONS_RECEIVED', 'RESPONSE_PREPARATION',
        'RESPONSE_SUBMITTED', 'FOLLOW_UP', 'CLOSED'
    )),
    start_date              TIMESTAMPTZ,
    end_date                TIMESTAMPTZ,
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    lead_contact_id         UUID NOT NULL REFERENCES users(id),
    inspector_names         TEXT,
    scope                   TEXT,
    outcome                 VARCHAR(30) CHECK (outcome IN ('NO_ACTION', 'VAI', 'OAI', 'WARNING_LETTER', 'CONSENT_DECREE')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_reg_insp_status ON regulatory_inspections(status);
CREATE INDEX idx_reg_insp_agency ON regulatory_inspections(agency);

CREATE TABLE regulatory_observations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id           UUID NOT NULL REFERENCES regulatory_inspections(id) ON DELETE CASCADE,
    observation_number      VARCHAR(50) NOT NULL UNIQUE,
    description             TEXT NOT NULL,
    classification          VARCHAR(20) NOT NULL CHECK (classification IN ('CRITICAL', 'MAJOR', 'MINOR', 'OBSERVATION')),
    cfr_reference           VARCHAR(255),
    area                    VARCHAR(255),
    status                  VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'RESPONSE_DRAFTED', 'RESPONSE_SUBMITTED', 'ACCEPTED', 'FOLLOW_UP', 'CLOSED'
    )),
    response_due_date       TIMESTAMPTZ,
    response_text           TEXT,
    capa_id                 UUID REFERENCES capas(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reg_obs_inspection ON regulatory_observations(inspection_id);
CREATE INDEX idx_reg_obs_status ON regulatory_observations(status);

CREATE TABLE regulatory_commitments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commitment_number       VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    source                  VARCHAR(30) NOT NULL CHECK (source IN (
        'INSPECTION', 'WARNING_LETTER', 'CONSENT_DECREE', 'VOLUNTARY', 'VARIATION'
    )),
    agency                  VARCHAR(100) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'VERIFIED', 'CLOSED'
    )),
    priority                VARCHAR(20) NOT NULL DEFAULT 'HIGH' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    commitment_date         TIMESTAMPTZ NOT NULL,
    due_date                TIMESTAMPTZ NOT NULL,
    completed_date          TIMESTAMPTZ,
    -- Links
    inspection_id           UUID REFERENCES regulatory_inspections(id),
    observation_id          UUID REFERENCES regulatory_observations(id),
    capa_id                 UUID REFERENCES capas(id),
    -- Assignments
    owner_id                UUID NOT NULL REFERENCES users(id),
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    -- Evidence
    evidence_of_completion  TEXT,
    verification_by_id      UUID REFERENCES users(id),
    verification_date       TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_reg_commit_status ON regulatory_commitments(status);
CREATE INDEX idx_reg_commit_due ON regulatory_commitments(due_date);
CREATE INDEX idx_reg_commit_owner ON regulatory_commitments(owner_id);

-- ============================================================================
-- 10. PERIODIC REVIEW ENGINE
-- ============================================================================

CREATE TABLE periodic_reviews (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_number           VARCHAR(50) NOT NULL UNIQUE,
    review_type             VARCHAR(30) NOT NULL CHECK (review_type IN (
        'SOP_REVIEW', 'SUPPLIER_REQUALIFICATION', 'EQUIPMENT_REQUALIFICATION',
        'CALIBRATION', 'TRAINING_RETRAINING', 'RISK_REVIEW', 'VALIDATION_PERIODIC'
    )),
    record_type             VARCHAR(50) NOT NULL,
    record_id               UUID NOT NULL,
    record_number           VARCHAR(100),
    status                  VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED', 'DUE', 'OVERDUE', 'IN_PROGRESS', 'COMPLETED', 'WAIVED'
    )),
    due_date                TIMESTAMPTZ NOT NULL,
    completed_date          TIMESTAMPTZ,
    assigned_to_id          UUID REFERENCES users(id),
    completed_by_id         UUID REFERENCES users(id),
    outcome                 VARCHAR(30) CHECK (outcome IN ('NO_CHANGE', 'CHANGE_REQUIRED', 'EXTENDED', 'RETIRED')),
    comments                TEXT,
    next_review_date        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_periodic_status ON periodic_reviews(status);
CREATE INDEX idx_periodic_due ON periodic_reviews(due_date);
CREATE INDEX idx_periodic_record ON periodic_reviews(record_type, record_id);

-- ============================================================================
-- 11. QUALITY METRICS & KPI SNAPSHOTS
-- ============================================================================

CREATE TABLE quality_metric_snapshots (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date           DATE NOT NULL,
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    module                  VARCHAR(50) NOT NULL,
    metric_name             VARCHAR(255) NOT NULL,
    metric_value            DECIMAL(12,4) NOT NULL,
    target_value            DECIMAL(12,4),
    unit                    VARCHAR(50),
    period_type             VARCHAR(20) NOT NULL CHECK (period_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qms_snapshot ON quality_metric_snapshots(snapshot_date, plant_site_id, module);

-- ============================================================================
-- 12. SEQUENCE COUNTERS FOR NEW MODULES
-- ============================================================================

INSERT INTO sequence_counters (sequence_name, year, current_value, prefix, format_pattern) VALUES
    ('RISK_REGISTER', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'RSK', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('RISK_ASSESSMENT', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'RA', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('AUDIT_PLAN', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'AP', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('AUDIT', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'AUD', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('AUDIT_FINDING', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'AF', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('SUPPLIER', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'SUP', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('SUPPLIER_QUAL', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'SQ', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('COMPLAINT', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'CMP', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('NONCONFORMANCE', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'NC', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('EQUIPMENT', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'EQP', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('CALIBRATION', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'CAL', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('MAINTENANCE', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'MNT', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('VALIDATION', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'VAL', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('MGMT_REVIEW', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'MR', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('REG_INSPECTION', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'RI', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('REG_OBSERVATION', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'RO', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('REG_COMMITMENT', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'RC', '{PREFIX}-{YEAR}-{SEQ:3}'),
    ('PERIODIC_REVIEW', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'PR', '{PREFIX}-{YEAR}-{SEQ:3}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. TRIGGERS FOR updated_at
-- ============================================================================

CREATE TRIGGER trg_risk_registers_updated_at BEFORE UPDATE ON risk_registers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_risk_assessments_updated_at BEFORE UPDATE ON risk_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_risk_controls_updated_at BEFORE UPDATE ON risk_controls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_audits_updated_at BEFORE UPDATE ON audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_audit_plans_updated_at BEFORE UPDATE ON audit_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_audit_findings_updated_at BEFORE UPDATE ON audit_findings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_supplier_quals_updated_at BEFORE UPDATE ON supplier_qualifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_nonconformances_updated_at BEFORE UPDATE ON nonconformances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_calibration_updated_at BEFORE UPDATE ON calibration_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_maintenance_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_validation_updated_at BEFORE UPDATE ON validation_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_validation_protocols_updated_at BEFORE UPDATE ON validation_test_protocols FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_mgmt_reviews_updated_at BEFORE UPDATE ON management_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_mgmt_review_actions_updated_at BEFORE UPDATE ON management_review_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_reg_inspections_updated_at BEFORE UPDATE ON regulatory_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_reg_observations_updated_at BEFORE UPDATE ON regulatory_observations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_reg_commitments_updated_at BEFORE UPDATE ON regulatory_commitments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_periodic_reviews_updated_at BEFORE UPDATE ON periodic_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. NEW PERMISSIONS FOR NEW MODULES
-- ============================================================================

INSERT INTO permissions (module, action, resource, description) VALUES
    -- Risk Management
    ('RISK', 'CREATE', 'risk_register', 'Create risk register'),
    ('RISK', 'READ', 'risk_register', 'View risk registers'),
    ('RISK', 'UPDATE', 'risk_register', 'Edit risk registers'),
    ('RISK', 'APPROVE', 'risk_register', 'Approve risk registers'),
    ('RISK', 'CREATE', 'risk_assessment', 'Create risk assessments'),
    ('RISK', 'READ', 'risk_assessment', 'View risk assessments'),
    ('RISK', 'UPDATE', 'risk_assessment', 'Edit risk assessments'),
    ('RISK', 'CLOSE', 'risk_assessment', 'Close risk assessments'),
    -- Audit Management
    ('AUDIT', 'CREATE', 'audit', 'Create audits'),
    ('AUDIT', 'READ', 'audit', 'View audits'),
    ('AUDIT', 'UPDATE', 'audit', 'Edit audits'),
    ('AUDIT', 'APPROVE', 'audit', 'Approve audit reports'),
    ('AUDIT', 'CREATE', 'audit_finding', 'Create audit findings'),
    ('AUDIT', 'UPDATE', 'audit_finding', 'Edit audit findings'),
    ('AUDIT', 'CLOSE', 'audit_finding', 'Close audit findings'),
    -- Supplier Quality
    ('SUPPLIER', 'CREATE', 'supplier', 'Create suppliers'),
    ('SUPPLIER', 'READ', 'supplier', 'View suppliers'),
    ('SUPPLIER', 'UPDATE', 'supplier', 'Edit suppliers'),
    ('SUPPLIER', 'APPROVE', 'supplier', 'Approve supplier qualifications'),
    -- Complaint Management
    ('COMPLAINT', 'CREATE', 'complaint', 'Create complaints'),
    ('COMPLAINT', 'READ', 'complaint', 'View complaints'),
    ('COMPLAINT', 'UPDATE', 'complaint', 'Edit complaints'),
    ('COMPLAINT', 'CLOSE', 'complaint', 'Close complaints'),
    -- Nonconformance
    ('NONCONFORMANCE', 'CREATE', 'nonconformance', 'Create nonconformances'),
    ('NONCONFORMANCE', 'READ', 'nonconformance', 'View nonconformances'),
    ('NONCONFORMANCE', 'UPDATE', 'nonconformance', 'Edit nonconformances'),
    ('NONCONFORMANCE', 'APPROVE', 'nonconformance', 'Approve dispositions'),
    ('NONCONFORMANCE', 'CLOSE', 'nonconformance', 'Close nonconformances'),
    -- Equipment
    ('EQUIPMENT', 'CREATE', 'equipment', 'Create equipment records'),
    ('EQUIPMENT', 'READ', 'equipment', 'View equipment'),
    ('EQUIPMENT', 'UPDATE', 'equipment', 'Edit equipment'),
    ('EQUIPMENT', 'CREATE', 'calibration', 'Create calibration records'),
    ('EQUIPMENT', 'UPDATE', 'calibration', 'Edit calibration records'),
    ('EQUIPMENT', 'APPROVE', 'calibration', 'Approve calibration results'),
    -- Validation
    ('VALIDATION', 'CREATE', 'validation_project', 'Create validation projects'),
    ('VALIDATION', 'READ', 'validation_project', 'View validation projects'),
    ('VALIDATION', 'UPDATE', 'validation_project', 'Edit validation projects'),
    ('VALIDATION', 'APPROVE', 'validation_project', 'Approve validation protocols/reports'),
    -- Management Review
    ('MANAGEMENT_REVIEW', 'CREATE', 'review', 'Create management reviews'),
    ('MANAGEMENT_REVIEW', 'READ', 'review', 'View management reviews'),
    ('MANAGEMENT_REVIEW', 'UPDATE', 'review', 'Edit management reviews'),
    ('MANAGEMENT_REVIEW', 'APPROVE', 'review', 'Approve management review minutes'),
    -- Regulatory
    ('REGULATORY', 'CREATE', 'inspection', 'Create regulatory inspections'),
    ('REGULATORY', 'READ', 'inspection', 'View regulatory records'),
    ('REGULATORY', 'UPDATE', 'inspection', 'Edit regulatory records'),
    ('REGULATORY', 'CREATE', 'commitment', 'Create regulatory commitments'),
    ('REGULATORY', 'UPDATE', 'commitment', 'Edit regulatory commitments'),
    ('REGULATORY', 'CLOSE', 'commitment', 'Close regulatory commitments')
ON CONFLICT DO NOTHING;
