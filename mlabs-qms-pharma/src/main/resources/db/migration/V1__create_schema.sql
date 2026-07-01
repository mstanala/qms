-- ============================================================================
-- QMS-Pharma Database DDL Scripts - PostgreSQL 17
-- Version: 1.0.0 (MVP1 - CAPA, Deviation, Change Control)
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATION & SITE MANAGEMENT
-- ============================================================================

CREATE TABLE organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50) NOT NULL UNIQUE,
    type                VARCHAR(50) NOT NULL CHECK (type IN ('MANUFACTURER', 'CDMO', 'NUTRACEUTICAL', 'API_MANUFACTURER')),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100) DEFAULT 'India',
    phone               VARCHAR(50),
    email               VARCHAR(255),
    gmp_certification   VARCHAR(50) CHECK (gmp_certification IN ('FDA', 'EU_GMP', 'WHO_GMP', 'SCHEDULE_M', 'NONE')),
    license_number      VARCHAR(100),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE plant_sites (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100) DEFAULT 'India',
    site_type           VARCHAR(50) CHECK (site_type IN ('MANUFACTURING', 'WAREHOUSE', 'LABORATORY', 'R_AND_D', 'OFFICE')),
    fda_registration    VARCHAR(100),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, code)
);

CREATE TABLE departments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_site_id       UUID NOT NULL REFERENCES plant_sites(id),
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    description         TEXT,
    parent_department_id UUID REFERENCES departments(id),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (plant_site_id, code)
);

-- ============================================================================
-- 2. USER & ACCESS MANAGEMENT (21 CFR Part 11 Compliant)
-- ============================================================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         VARCHAR(50) NOT NULL UNIQUE,
    username            VARCHAR(100) NOT NULL UNIQUE,
    email               VARCHAR(255) NOT NULL UNIQUE,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    display_name        VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    password_hash       VARCHAR(512),
    phone               VARCHAR(50),
    job_title           VARCHAR(255),
    user_type           VARCHAR(50) NOT NULL CHECK (user_type IN (
        'OPERATOR', 'QA_SPECIALIST', 'QUALITY_MANAGER', 'CAPA_COORDINATOR',
        'INVESTIGATOR_SME', 'CHANGE_OWNER', 'DOC_CONTROL_SPECIALIST',
        'TRAINING_ADMIN', 'AUDITOR', 'SITE_QUALITY_HEAD',
        'SYSTEM_ADMIN', 'EXTERNAL_SUPPLIER'
    )),
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    plant_site_id       UUID REFERENCES plant_sites(id),
    department_id       UUID REFERENCES departments(id),
    manager_id          UUID REFERENCES users(id),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at           TIMESTAMPTZ,
    lock_reason         VARCHAR(255),
    failed_login_count  INTEGER NOT NULL DEFAULT 0,
    last_login_at       TIMESTAMPTZ,
    last_password_change TIMESTAMPTZ,
    password_expires_at TIMESTAMPTZ,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    oauth_provider      VARCHAR(50),
    oauth_subject       VARCHAR(255),
    saml_name_id        VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID REFERENCES users(id),
    updated_by          UUID REFERENCES users(id)
);

-- Security Profiles
CREATE TABLE security_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL UNIQUE,
    description         TEXT,
    is_system           BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Application Roles
CREATE TABLE application_roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL UNIQUE,
    code                VARCHAR(50) NOT NULL UNIQUE,
    description         TEXT,
    role_level          VARCHAR(50) NOT NULL CHECK (role_level IN (
        'END_USER', 'OWNER', 'REVIEWER', 'APPROVER',
        'QA_REVIEWER', 'QA_APPROVER', 'TRAINING_ADMIN', 'VAULT_ADMIN'
    )),
    is_system           BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions
CREATE TABLE permissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module              VARCHAR(50) NOT NULL CHECK (module IN ('CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT', 'TRAINING', 'AUDIT', 'ADMIN', 'REPORT')),
    action              VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CLOSE', 'REOPEN', 'ASSIGN', 'EXPORT', 'CONFIGURE')),
    resource            VARCHAR(100) NOT NULL,
    description         TEXT,
    UNIQUE (module, action, resource)
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id             UUID NOT NULL REFERENCES application_roles(id) ON DELETE CASCADE,
    permission_id       UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE (role_id, permission_id)
);

-- User-Role assignment
CREATE TABLE user_roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id             UUID NOT NULL REFERENCES application_roles(id) ON DELETE CASCADE,
    plant_site_id       UUID REFERENCES plant_sites(id),
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by         UUID REFERENCES users(id),
    valid_from          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until         TIMESTAMPTZ,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (user_id, role_id, plant_site_id)
);

-- User-Security Profile mapping
CREATE TABLE user_security_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    security_profile_id UUID NOT NULL REFERENCES security_profiles(id) ON DELETE CASCADE,
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by         UUID REFERENCES users(id),
    UNIQUE (user_id, security_profile_id)
);

-- Security Profile Permissions
CREATE TABLE security_profile_permissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    security_profile_id UUID NOT NULL REFERENCES security_profiles(id) ON DELETE CASCADE,
    permission_id       UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE (security_profile_id, permission_id)
);

-- User login audit (21 CFR Part 11)
CREATE TABLE user_login_audit (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id),
    username            VARCHAR(100) NOT NULL,
    login_timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logout_timestamp    TIMESTAMPTZ,
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    login_status        VARCHAR(20) NOT NULL CHECK (login_status IN ('SUCCESS', 'FAILED', 'LOCKED_OUT', 'SESSION_EXPIRED')),
    failure_reason      VARCHAR(255),
    session_id          VARCHAR(255)
);

-- ============================================================================
-- 3. ELECTRONIC SIGNATURE (21 CFR Part 11)
-- ============================================================================

CREATE TABLE electronic_signatures (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    record_type         VARCHAR(50) NOT NULL CHECK (record_type IN ('CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT', 'TRAINING')),
    record_id           UUID NOT NULL,
    action              VARCHAR(100) NOT NULL,
    meaning             VARCHAR(255) NOT NULL,
    signature_hash      VARCHAR(512) NOT NULL,
    signed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address          VARCHAR(45),
    comments            TEXT,
    is_valid            BOOLEAN NOT NULL DEFAULT TRUE,
    invalidated_at      TIMESTAMPTZ,
    invalidated_by      UUID REFERENCES users(id),
    invalidation_reason TEXT
);

CREATE INDEX idx_esig_record ON electronic_signatures(record_type, record_id);
CREATE INDEX idx_esig_user ON electronic_signatures(user_id);

-- ============================================================================
-- 4. DEVIATION MANAGEMENT
-- ============================================================================

CREATE TABLE deviations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_number        VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    type                    VARCHAR(20) NOT NULL CHECK (type IN ('PLANNED', 'UNPLANNED')),
    category                VARCHAR(30) NOT NULL CHECK (category IN (
        'PROCESS', 'EQUIPMENT', 'MATERIAL', 'DOCUMENTATION',
        'ENVIRONMENTAL', 'PERSONNEL', 'UTILITY', 'LABORATORY',
        'PACKAGING', 'CLEANING'
    )),
    classification          VARCHAR(20) CHECK (classification IN ('CRITICAL', 'MAJOR', 'MINOR')),
    status                  VARCHAR(30) NOT NULL DEFAULT 'REPORTED' CHECK (status IN (
        'REPORTED', 'UNDER_REVIEW', 'CLASSIFIED', 'INVESTIGATION',
        'IMPACT_ASSESSMENT', 'DISPOSITION', 'CAPA_INITIATED',
        'PENDING_CLOSURE', 'CLOSED', 'REJECTED'
    )),
    source_area             VARCHAR(255),

    -- Dates
    occurred_date           TIMESTAMPTZ NOT NULL,
    reported_date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detected_date           TIMESTAMPTZ NOT NULL,
    target_closure_date     TIMESTAMPTZ NOT NULL,
    actual_closure_date     TIMESTAMPTZ,

    -- People
    reported_by_id          UUID NOT NULL REFERENCES users(id),
    assigned_to_id          UUID REFERENCES users(id),
    reviewer_id             UUID REFERENCES users(id),
    approved_by_id          UUID REFERENCES users(id),

    -- Location
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    department_id           UUID NOT NULL REFERENCES departments(id),
    area                    VARCHAR(255),
    equipment               VARCHAR(255),

    -- Product Impact
    product                 VARCHAR(255),
    batch_number            VARCHAR(100),
    batch_size              VARCHAR(100),
    gmp_impact              BOOLEAN NOT NULL DEFAULT FALSE,
    patient_safety_impact   BOOLEAN NOT NULL DEFAULT FALSE,
    regulatory_impact       BOOLEAN NOT NULL DEFAULT FALSE,

    -- CAPA Link
    capa_required           BOOLEAN NOT NULL DEFAULT FALSE,
    capa_id                 UUID,

    -- Workflow
    current_workflow_step   VARCHAR(100) NOT NULL DEFAULT 'Reported',
    flowable_process_id     VARCHAR(255),

    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_dev_status ON deviations(status);
CREATE INDEX idx_dev_number ON deviations(deviation_number);
CREATE INDEX idx_dev_plant ON deviations(plant_site_id);
CREATE INDEX idx_dev_department ON deviations(department_id);
CREATE INDEX idx_dev_reported_by ON deviations(reported_by_id);
CREATE INDEX idx_dev_assigned_to ON deviations(assigned_to_id);
CREATE INDEX idx_dev_dates ON deviations(target_closure_date, actual_closure_date);

-- Deviation affected batches
CREATE TABLE deviation_affected_batches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_id        UUID NOT NULL REFERENCES deviations(id) ON DELETE CASCADE,
    batch_number        VARCHAR(100) NOT NULL,
    product_name        VARCHAR(255),
    batch_size          VARCHAR(100),
    impact_description  TEXT,
    disposition         VARCHAR(50) CHECK (disposition IN ('RELEASE', 'RELEASE_WITH_CONDITIONS', 'REPROCESS', 'REWORK', 'REJECT', 'QUARANTINE', 'USE_AS_IS'))
);

CREATE INDEX idx_dev_batches ON deviation_affected_batches(deviation_id);

-- Deviation Investigation
CREATE TABLE deviation_investigations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_id            UUID NOT NULL REFERENCES deviations(id) ON DELETE CASCADE UNIQUE,
    investigator_id         UUID NOT NULL REFERENCES users(id),
    start_date              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_date          TIMESTAMPTZ,
    probable_cause          TEXT,
    root_cause              TEXT,
    findings                TEXT,
    conclusion              TEXT,
    method                  VARCHAR(100),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deviation investigation immediate actions
CREATE TABLE deviation_immediate_actions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id    UUID NOT NULL REFERENCES deviation_investigations(id) ON DELETE CASCADE,
    action_description  TEXT NOT NULL,
    action_order        INTEGER NOT NULL DEFAULT 0
);

-- Deviation Impact Assessment
CREATE TABLE deviation_impact_assessments (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_id                UUID NOT NULL REFERENCES deviations(id) ON DELETE CASCADE UNIQUE,
    product_quality_impact      VARCHAR(20) NOT NULL CHECK (product_quality_impact IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    patient_safety_impact       VARCHAR(20) NOT NULL CHECK (patient_safety_impact IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    regulatory_impact           VARCHAR(20) NOT NULL CHECK (regulatory_impact IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    business_impact             VARCHAR(20) NOT NULL CHECK (business_impact IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    overall_risk_level          VARCHAR(20) NOT NULL CHECK (overall_risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    affected_products           TEXT[],
    affected_batches            TEXT[],
    batch_disposition           TEXT,
    justification               TEXT NOT NULL,
    assessed_by_id              UUID NOT NULL REFERENCES users(id),
    assessed_date               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deviation Disposition
CREATE TABLE deviation_dispositions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_id        UUID NOT NULL REFERENCES deviations(id) ON DELETE CASCADE UNIQUE,
    decision            VARCHAR(30) NOT NULL CHECK (decision IN (
        'RELEASE', 'RELEASE_WITH_CONDITIONS', 'REPROCESS',
        'REWORK', 'REJECT', 'QUARANTINE', 'USE_AS_IS'
    )),
    justification       TEXT NOT NULL,
    conditions          TEXT,
    approved_by_id      UUID NOT NULL REFERENCES users(id),
    approved_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    qa_review_comments  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. CAPA MANAGEMENT
-- ============================================================================

CREATE TABLE capas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_number             VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    type                    VARCHAR(30) NOT NULL CHECK (type IN ('CORRECTIVE', 'PREVENTIVE', 'CORRECTIVE_AND_PREVENTIVE')),
    status                  VARCHAR(30) NOT NULL DEFAULT 'INITIATED' CHECK (status IN (
        'INITIATED', 'UNDER_REVIEW', 'INVESTIGATION', 'ROOT_CAUSE_IDENTIFIED',
        'ACTION_PLANNING', 'ACTION_IN_PROGRESS', 'EFFECTIVENESS_CHECK',
        'PENDING_CLOSURE', 'CLOSED', 'REJECTED'
    )),
    priority                VARCHAR(20) NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    source_type             VARCHAR(30) NOT NULL CHECK (source_type IN (
        'DEVIATION', 'AUDIT_FINDING', 'COMPLAINT', 'OOS_RESULT',
        'RISK_ASSESSMENT', 'MANAGEMENT_REVIEW', 'REGULATORY_OBSERVATION',
        'SELF_IDENTIFIED'
    )),
    source_reference        VARCHAR(255),

    -- Dates
    initiated_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    target_completion_date  TIMESTAMPTZ NOT NULL,
    actual_completion_date  TIMESTAMPTZ,
    due_date                TIMESTAMPTZ NOT NULL,

    -- Assignments
    initiator_id            UUID NOT NULL REFERENCES users(id),
    owner_id                UUID NOT NULL REFERENCES users(id),
    department_id           UUID NOT NULL REFERENCES departments(id),

    -- Location
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),

    -- Product
    product                 VARCHAR(255),
    batch_number            VARCHAR(100),

    -- Source Deviation link
    deviation_id            UUID REFERENCES deviations(id),

    -- Workflow
    current_workflow_step   VARCHAR(100) NOT NULL DEFAULT 'Initiation',
    flowable_process_id     VARCHAR(255),

    -- Metadata
    closed_at               TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);

-- Add FK from deviations to capas (circular reference)
ALTER TABLE deviations ADD CONSTRAINT fk_deviation_capa FOREIGN KEY (capa_id) REFERENCES capas(id);

CREATE INDEX idx_capa_status ON capas(status);
CREATE INDEX idx_capa_number ON capas(capa_number);
CREATE INDEX idx_capa_priority ON capas(priority);
CREATE INDEX idx_capa_plant ON capas(plant_site_id);
CREATE INDEX idx_capa_department ON capas(department_id);
CREATE INDEX idx_capa_owner ON capas(owner_id);
CREATE INDEX idx_capa_initiator ON capas(initiator_id);
CREATE INDEX idx_capa_deviation ON capas(deviation_id);
CREATE INDEX idx_capa_dates ON capas(due_date, target_completion_date);

-- Root Cause Analysis
CREATE TABLE capa_root_cause_analyses (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_id                 UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE UNIQUE,
    method                  VARCHAR(30) NOT NULL CHECK (method IN ('FIVE_WHY', 'FISHBONE', 'FAULT_TREE', 'PARETO', 'FAILURE_MODE')),
    description             TEXT NOT NULL,
    root_causes             TEXT[] NOT NULL DEFAULT '{}',
    contributing_factors    TEXT[] DEFAULT '{}',
    fishbone_diagram_url    VARCHAR(1000),
    completed_date          TIMESTAMPTZ,
    completed_by_id         UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Five Why entries
CREATE TABLE capa_five_why_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rca_id              UUID NOT NULL REFERENCES capa_root_cause_analyses(id) ON DELETE CASCADE,
    level               INTEGER NOT NULL CHECK (level >= 1 AND level <= 7),
    question            TEXT NOT NULL,
    answer              TEXT NOT NULL,
    UNIQUE (rca_id, level)
);

-- Fishbone categories (for Ishikawa diagram)
CREATE TABLE capa_fishbone_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rca_id              UUID NOT NULL REFERENCES capa_root_cause_analyses(id) ON DELETE CASCADE,
    category_name       VARCHAR(100) NOT NULL,
    causes              TEXT[] NOT NULL DEFAULT '{}'
);

-- Risk Assessment
CREATE TABLE capa_risk_assessments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_id             UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE UNIQUE,
    severity            INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
    occurrence          INTEGER NOT NULL CHECK (occurrence >= 1 AND occurrence <= 5),
    detection           INTEGER NOT NULL CHECK (detection >= 1 AND detection <= 5),
    rpn                 INTEGER GENERATED ALWAYS AS (severity * occurrence * detection) STORED,
    risk_level          VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    justification       TEXT NOT NULL,
    assessed_by_id      UUID REFERENCES users(id),
    assessed_date       TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CAPA Actions (Corrective and Preventive)
CREATE TABLE capa_actions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_id             UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
    action_number       VARCHAR(50) NOT NULL,
    description         TEXT NOT NULL,
    type                VARCHAR(20) NOT NULL CHECK (type IN ('CORRECTIVE', 'PREVENTIVE')),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'OVERDUE')),
    assigned_to_id      UUID NOT NULL REFERENCES users(id),
    due_date            TIMESTAMPTZ NOT NULL,
    completed_date      TIMESTAMPTZ,
    evidence            TEXT,
    evidence_url        VARCHAR(1000),
    verified_by_id      UUID REFERENCES users(id),
    verified_date       TIMESTAMPTZ,
    verification_comments TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (capa_id, action_number)
);

CREATE INDEX idx_capa_actions_capa ON capa_actions(capa_id);
CREATE INDEX idx_capa_actions_status ON capa_actions(status);
CREATE INDEX idx_capa_actions_assigned ON capa_actions(assigned_to_id);

-- Effectiveness Check
CREATE TABLE capa_effectiveness_checks (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_id                 UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
    criteria                TEXT NOT NULL,
    check_date              TIMESTAMPTZ NOT NULL,
    result                  VARCHAR(30) NOT NULL CHECK (result IN ('EFFECTIVE', 'NOT_EFFECTIVE', 'PARTIALLY_EFFECTIVE')),
    evidence                TEXT NOT NULL,
    verified_by_id          UUID NOT NULL REFERENCES users(id),
    comments                TEXT,
    requires_recurrence     BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_months       INTEGER,
    next_check_date         TIMESTAMPTZ,
    check_number            INTEGER NOT NULL DEFAULT 1,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_capa_eff_capa ON capa_effectiveness_checks(capa_id);

-- ============================================================================
-- 6. CHANGE CONTROL MANAGEMENT
-- ============================================================================

CREATE TABLE change_requests (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_number               VARCHAR(50) NOT NULL UNIQUE,
    title                       VARCHAR(500) NOT NULL,
    description                 TEXT NOT NULL,
    justification               TEXT NOT NULL,
    type                        VARCHAR(30) NOT NULL CHECK (type IN (
        'PROCESS', 'EQUIPMENT', 'FACILITY', 'DOCUMENT', 'SYSTEM',
        'MATERIAL', 'SUPPLIER', 'REGULATORY', 'PACKAGING', 'METHOD'
    )),
    category                    VARCHAR(30) NOT NULL CHECK (category IN (
        'PRODUCT', 'NON_PRODUCT', 'QUALITY_SYSTEM',
        'REGULATORY_SUBMISSION', 'SITE', 'TECHNOLOGY_TRANSFER'
    )),
    classification              VARCHAR(20) NOT NULL CHECK (classification IN ('MINOR', 'MAJOR', 'CRITICAL')),
    status                      VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'IMPACT_ASSESSMENT', 'QA_REVIEW',
        'RA_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'IMPLEMENTATION',
        'VERIFICATION', 'EFFECTIVENESS_CHECK', 'CLOSED', 'REJECTED', 'WITHDRAWN'
    )),
    priority                    VARCHAR(20) NOT NULL CHECK (priority IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),

    -- Originator
    requested_by_id             UUID NOT NULL REFERENCES users(id),
    requested_date              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    department_id               UUID NOT NULL REFERENCES departments(id),

    -- Assignment
    change_owner_id             UUID NOT NULL REFERENCES users(id),
    qa_reviewer_id              UUID REFERENCES users(id),
    ra_reviewer_id              UUID REFERENCES users(id),

    -- Location
    plant_site_id               UUID NOT NULL REFERENCES plant_sites(id),
    affected_areas              TEXT[] DEFAULT '{}',

    -- Dates
    target_implementation_date  TIMESTAMPTZ NOT NULL,
    actual_implementation_date  TIMESTAMPTZ,
    effectiveness_check_date    TIMESTAMPTZ,
    closed_date                 TIMESTAMPTZ,

    -- Regulatory
    regulatory_filing_required  BOOLEAN NOT NULL DEFAULT FALSE,
    validation_required         BOOLEAN NOT NULL DEFAULT FALSE,
    validation_details          TEXT,
    training_required           BOOLEAN NOT NULL DEFAULT FALSE,

    -- References
    related_deviations          TEXT[] DEFAULT '{}',
    related_capas               TEXT[] DEFAULT '{}',
    related_changes             TEXT[] DEFAULT '{}',

    -- Workflow
    current_workflow_step       VARCHAR(100) NOT NULL DEFAULT 'Draft',
    flowable_process_id         VARCHAR(255),

    -- Metadata
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by                  UUID NOT NULL REFERENCES users(id),
    updated_by                  UUID NOT NULL REFERENCES users(id),
    version                     INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_cc_status ON change_requests(status);
CREATE INDEX idx_cc_number ON change_requests(change_number);
CREATE INDEX idx_cc_plant ON change_requests(plant_site_id);
CREATE INDEX idx_cc_department ON change_requests(department_id);
CREATE INDEX idx_cc_owner ON change_requests(change_owner_id);
CREATE INDEX idx_cc_classification ON change_requests(classification);
CREATE INDEX idx_cc_dates ON change_requests(target_implementation_date);

-- Change Impact Assessment
CREATE TABLE change_impact_assessments (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id           UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE UNIQUE,
    product_quality             VARCHAR(20) NOT NULL CHECK (product_quality IN ('NO_IMPACT', 'LOW', 'MEDIUM', 'HIGH')),
    patient_safety              VARCHAR(20) NOT NULL CHECK (patient_safety IN ('NO_IMPACT', 'LOW', 'MEDIUM', 'HIGH')),
    regulatory_compliance       VARCHAR(20) NOT NULL CHECK (regulatory_compliance IN ('NO_IMPACT', 'LOW', 'MEDIUM', 'HIGH')),
    validation_status           VARCHAR(20) NOT NULL CHECK (validation_status IN ('NO_IMPACT', 'LOW', 'MEDIUM', 'HIGH')),
    documentation               VARCHAR(20) NOT NULL CHECK (documentation IN ('NO_IMPACT', 'LOW', 'MEDIUM', 'HIGH')),
    training                    VARCHAR(20) NOT NULL CHECK (training IN ('NO_IMPACT', 'LOW', 'MEDIUM', 'HIGH')),
    supplier_qualification      VARCHAR(20) NOT NULL CHECK (supplier_qualification IN ('NO_IMPACT', 'LOW', 'MEDIUM', 'HIGH')),
    stability                   VARCHAR(20) NOT NULL CHECK (stability IN ('NO_IMPACT', 'LOW', 'MEDIUM', 'HIGH')),
    overall_risk_level          VARCHAR(20) NOT NULL CHECK (overall_risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    assessment_summary          TEXT NOT NULL,
    assessed_by_id              UUID REFERENCES users(id),
    assessed_date               TIMESTAMPTZ DEFAULT NOW(),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Regulatory Filing Requirement
CREATE TABLE change_regulatory_filings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id       UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE UNIQUE,
    filing_required         BOOLEAN NOT NULL DEFAULT FALSE,
    filing_type             VARCHAR(30) CHECK (filing_type IN (
        'CBE_30', 'CBE_0', 'PAS', 'ANNUAL_REPORT',
        'VARIATION_TYPE_IA', 'VARIATION_TYPE_IB', 'VARIATION_TYPE_II', 'NONE'
    )),
    markets                 TEXT[] DEFAULT '{}',
    filing_details          TEXT,
    target_filing_date      TIMESTAMPTZ,
    filing_status           VARCHAR(20) CHECK (filing_status IN ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED'))
);

-- Affected Documents
CREATE TABLE change_affected_documents (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id       UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    document_number         VARCHAR(100) NOT NULL,
    document_title          VARCHAR(500) NOT NULL,
    document_type           VARCHAR(100),
    current_version         VARCHAR(50),
    action                  VARCHAR(20) NOT NULL CHECK (action IN ('REVISE', 'RETIRE', 'CREATE_NEW', 'NO_CHANGE')),
    new_version             VARCHAR(50),
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED'))
);

CREATE INDEX idx_cc_docs ON change_affected_documents(change_request_id);

-- Affected Products
CREATE TABLE change_affected_products (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id       UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    product_name            VARCHAR(255) NOT NULL,
    product_code            VARCHAR(100) NOT NULL,
    dosage_form             VARCHAR(100),
    markets                 TEXT[] DEFAULT '{}',
    impact_description      TEXT
);

CREATE INDEX idx_cc_products ON change_affected_products(change_request_id);

-- Implementation Tasks
CREATE TABLE change_implementation_tasks (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id       UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    task_number             INTEGER NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT,
    assigned_to_id          UUID NOT NULL REFERENCES users(id),
    department_id           UUID REFERENCES departments(id),
    due_date                TIMESTAMPTZ NOT NULL,
    completed_date          TIMESTAMPTZ,
    status                  VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED')),
    comments                TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (change_request_id, task_number)
);

CREATE INDEX idx_cc_tasks ON change_implementation_tasks(change_request_id);

-- Training Requirements for Change Control
CREATE TABLE change_training_requirements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id       UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    training_title          VARCHAR(500) NOT NULL,
    target_audience         VARCHAR(255),
    department_id           UUID REFERENCES departments(id),
    training_type           VARCHAR(30) NOT NULL CHECK (training_type IN ('SOP_READ', 'CLASSROOM', 'OJT', 'E_LEARNING', 'PRACTICAL')),
    due_date                TIMESTAMPTZ NOT NULL,
    completion_status       VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (completion_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    completion_percentage   INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Change Approvals
CREATE TABLE change_approvals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id       UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    approver_id             UUID NOT NULL REFERENCES users(id),
    role                    VARCHAR(100) NOT NULL,
    department              VARCHAR(255),
    decision                VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (decision IN ('PENDING', 'APPROVED', 'REJECTED', 'APPROVED_WITH_COMMENTS')),
    comments                TEXT,
    decision_date           TIMESTAMPTZ,
    esignature_id           UUID REFERENCES electronic_signatures(id),
    approval_order          INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cc_approvals ON change_approvals(change_request_id);
CREATE INDEX idx_cc_approvals_approver ON change_approvals(approver_id);

-- Change Effectiveness Review
CREATE TABLE change_effectiveness_reviews (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id       UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    review_date             TIMESTAMPTZ NOT NULL,
    reviewer_id             UUID NOT NULL REFERENCES users(id),
    overall_effective       BOOLEAN NOT NULL,
    summary                 TEXT NOT NULL,
    follow_up_required      BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_actions       TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Change Effectiveness Criteria
CREATE TABLE change_effectiveness_criteria (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id               UUID NOT NULL REFERENCES change_effectiveness_reviews(id) ON DELETE CASCADE,
    criterion               TEXT NOT NULL,
    met                     BOOLEAN NOT NULL,
    evidence                TEXT NOT NULL
);

-- ============================================================================
-- 7. SHARED: AUDIT TRAIL (21 CFR Part 11 / ALCOA+)
-- ============================================================================

CREATE TABLE audit_trail (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type         VARCHAR(50) NOT NULL CHECK (record_type IN (
        'CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'USER', 'ROLE',
        'DOCUMENT', 'TRAINING', 'SYSTEM_CONFIG'
    )),
    record_id           UUID NOT NULL,
    record_number       VARCHAR(100),
    action              VARCHAR(100) NOT NULL,
    field_name          VARCHAR(255),
    old_value           TEXT,
    new_value           TEXT,
    comments            TEXT,
    reason_for_change   TEXT,
    user_id             UUID NOT NULL REFERENCES users(id),
    user_name           VARCHAR(255) NOT NULL,
    esignature_id       UUID REFERENCES electronic_signatures(id),
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_record ON audit_trail(record_type, record_id);
CREATE INDEX idx_audit_user ON audit_trail(user_id);
CREATE INDEX idx_audit_timestamp ON audit_trail(timestamp);
CREATE INDEX idx_audit_action ON audit_trail(action);

-- ============================================================================
-- 8. SHARED: WORKFLOW HISTORY
-- ============================================================================

CREATE TABLE workflow_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type         VARCHAR(50) NOT NULL CHECK (record_type IN ('CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT')),
    record_id           UUID NOT NULL,
    step_name           VARCHAR(255) NOT NULL,
    status              VARCHAR(20) NOT NULL CHECK (status IN ('COMPLETED', 'CURRENT', 'PENDING', 'SKIPPED')),
    assigned_to_id      UUID REFERENCES users(id),
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    comments            TEXT,
    step_order           INTEGER NOT NULL DEFAULT 0,
    flowable_task_id    VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wf_record ON workflow_history(record_type, record_id);
CREATE INDEX idx_wf_assigned ON workflow_history(assigned_to_id);
CREATE INDEX idx_wf_status ON workflow_history(status);

-- ============================================================================
-- 9. SHARED: ATTACHMENTS (Google Cloud Storage references)
-- ============================================================================

CREATE TABLE attachments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type         VARCHAR(50) NOT NULL CHECK (record_type IN ('CAPA', 'DEVIATION', 'CHANGE_CONTROL', 'DOCUMENT', 'TRAINING')),
    record_id           UUID NOT NULL,
    file_name           VARCHAR(500) NOT NULL,
    file_type           VARCHAR(100) NOT NULL,
    file_size           BIGINT NOT NULL,
    storage_path        VARCHAR(1000) NOT NULL,
    gcs_bucket          VARCHAR(255),
    gcs_object_key      VARCHAR(1000),
    checksum_sha256     VARCHAR(64),
    category            VARCHAR(50) DEFAULT 'OTHER' CHECK (category IN (
        'SUPPORTING_DATA', 'RISK_ASSESSMENT', 'VALIDATION',
        'REGULATORY', 'TRAINING', 'EVIDENCE', 'INVESTIGATION', 'OTHER'
    )),
    description         TEXT,
    uploaded_by_id      UUID NOT NULL REFERENCES users(id),
    uploaded_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES users(id)
);

CREATE INDEX idx_attach_record ON attachments(record_type, record_id);
CREATE INDEX idx_attach_uploaded ON attachments(uploaded_by_id);

-- ============================================================================
-- 10. SHARED: COMMENTS / NOTES
-- ============================================================================

CREATE TABLE record_comments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type         VARCHAR(50) NOT NULL CHECK (record_type IN ('CAPA', 'DEVIATION', 'CHANGE_CONTROL')),
    record_id           UUID NOT NULL,
    comment_text        TEXT NOT NULL,
    comment_type        VARCHAR(30) DEFAULT 'GENERAL' CHECK (comment_type IN ('GENERAL', 'REVIEW', 'APPROVAL', 'INVESTIGATION', 'SYSTEM')),
    user_id             UUID NOT NULL REFERENCES users(id),
    parent_comment_id   UUID REFERENCES record_comments(id),
    is_internal         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_record ON record_comments(record_type, record_id);

-- ============================================================================
-- 11. NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    title               VARCHAR(500) NOT NULL,
    message             TEXT NOT NULL,
    notification_type   VARCHAR(30) NOT NULL CHECK (notification_type IN (
        'TASK_ASSIGNED', 'APPROVAL_REQUIRED', 'OVERDUE_ALERT',
        'STATUS_CHANGE', 'ESCALATION', 'SYSTEM', 'REMINDER'
    )),
    record_type         VARCHAR(50),
    record_id           UUID,
    record_number       VARCHAR(100),
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMPTZ,
    is_email_sent       BOOLEAN NOT NULL DEFAULT FALSE,
    priority            VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created ON notifications(created_at);

-- ============================================================================
-- 12. SEQUENCE NUMBER GENERATORS
-- ============================================================================

CREATE TABLE sequence_counters (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_name       VARCHAR(100) NOT NULL,
    plant_site_id       UUID REFERENCES plant_sites(id),
    year                INTEGER NOT NULL,
    current_value       INTEGER NOT NULL DEFAULT 0,
    prefix              VARCHAR(20) NOT NULL,
    format_pattern      VARCHAR(100) NOT NULL DEFAULT '{PREFIX}-{YEAR}-{SEQ:3}',
    UNIQUE (sequence_name, plant_site_id, year)
);

-- ============================================================================
-- 13. SYSTEM CONFIGURATION
-- ============================================================================

CREATE TABLE system_configurations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key          VARCHAR(255) NOT NULL,
    config_value        TEXT NOT NULL,
    config_type         VARCHAR(30) DEFAULT 'STRING' CHECK (config_type IN ('STRING', 'INTEGER', 'BOOLEAN', 'JSON')),
    module              VARCHAR(50),
    plant_site_id       UUID REFERENCES plant_sites(id),
    description         TEXT,
    is_encrypted        BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          UUID REFERENCES users(id),
    UNIQUE (config_key, module, plant_site_id)
);

-- ============================================================================
-- 14. LOOKUP / REFERENCE DATA
-- ============================================================================

CREATE TABLE lookup_values (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category            VARCHAR(100) NOT NULL,
    code                VARCHAR(100) NOT NULL,
    display_value       VARCHAR(500) NOT NULL,
    description         TEXT,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    parent_id           UUID REFERENCES lookup_values(id),
    plant_site_id       UUID REFERENCES plant_sites(id),
    UNIQUE (category, code, plant_site_id)
);

CREATE INDEX idx_lookup_category ON lookup_values(category, is_active);

-- ============================================================================
-- 15. PRODUCTS & BATCHES REFERENCE
-- ============================================================================

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code        VARCHAR(100) NOT NULL UNIQUE,
    product_name        VARCHAR(500) NOT NULL,
    dosage_form         VARCHAR(100),
    strength            VARCHAR(100),
    therapeutic_category VARCHAR(255),
    plant_site_id       UUID REFERENCES plant_sites(id),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE batches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number        VARCHAR(100) NOT NULL UNIQUE,
    product_id          UUID NOT NULL REFERENCES products(id),
    batch_size          VARCHAR(100),
    manufacturing_date  DATE,
    expiry_date         DATE,
    status              VARCHAR(30) DEFAULT 'IN_PROCESS' CHECK (status IN ('IN_PROCESS', 'RELEASED', 'QUARANTINED', 'REJECTED', 'RECALLED')),
    plant_site_id       UUID NOT NULL REFERENCES plant_sites(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batch_product ON batches(product_id);
CREATE INDEX idx_batch_number ON batches(batch_number);

-- ============================================================================
-- 16. UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_plant_sites_updated_at BEFORE UPDATE ON plant_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_deviations_updated_at BEFORE UPDATE ON deviations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_capas_updated_at BEFORE UPDATE ON capas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_change_requests_updated_at BEFORE UPDATE ON change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_capa_actions_updated_at BEFORE UPDATE ON capa_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();