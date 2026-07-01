-- ============================================================================
-- V4: Document Management & Training Management Schema
-- ============================================================================

-- ─── DOCUMENT MANAGEMENT ───────────────────────────────────────────────────

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'SOP', 'WORK_INSTRUCTION', 'BATCH_RECORD', 'PROTOCOL', 'REPORT',
        'POLICY', 'FORM', 'SPECIFICATION', 'VALIDATION_PROTOCOL',
        'STANDARD', 'GUIDELINE', 'MANUAL')),
    category VARCHAR(100),
    sub_category VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    plant_site_id UUID REFERENCES plant_sites(id),
    owner_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_REVIEW', 'UNDER_REVIEW', 'PENDING_APPROVAL',
        'APPROVED', 'EFFECTIVE', 'SUPERSEDED', 'OBSOLETE', 'ARCHIVED')),
    current_version VARCHAR(20) DEFAULT '1.0',
    current_version_id UUID,
    effective_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    next_review_date TIMESTAMPTZ,
    review_period_months INTEGER DEFAULT 24,
    confidentiality_level VARCHAR(20) NOT NULL DEFAULT 'INTERNAL' CHECK (
        confidentiality_level IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED')),
    regulatory_reference VARCHAR(255),
    keywords TEXT,
    template_id UUID REFERENCES documents(id),
    is_template BOOLEAN NOT NULL DEFAULT false,
    flowable_process_id VARCHAR(255),
    current_workflow_step VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    version_number VARCHAR(20) NOT NULL,
    major_version INTEGER NOT NULL DEFAULT 1,
    minor_version INTEGER NOT NULL DEFAULT 0,
    change_description TEXT NOT NULL,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'NEW', 'MINOR_REVISION', 'MAJOR_REVISION', 'PERIODIC_REVIEW', 'CORRECTION')),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'UNDER_REVIEW', 'APPROVED', 'EFFECTIVE', 'SUPERSEDED', 'REJECTED')),
    file_path VARCHAR(1000),
    file_name VARCHAR(500),
    file_size BIGINT,
    content_type VARCHAR(100),
    content_hash VARCHAR(128),
    author_id UUID REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    approver_id UUID REFERENCES users(id),
    approved_date TIMESTAMPTZ,
    effective_date TIMESTAMPTZ,
    superseded_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

ALTER TABLE documents ADD CONSTRAINT fk_documents_current_version
    FOREIGN KEY (current_version_id) REFERENCES document_versions(id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE document_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    review_type VARCHAR(50) NOT NULL DEFAULT 'PERIODIC' CHECK (
        review_type IN ('PERIODIC', 'TRIGGERED', 'INITIAL')),
    review_due_date TIMESTAMPTZ NOT NULL,
    review_completed_date TIMESTAMPTZ,
    reviewer_id UUID REFERENCES users(id),
    review_decision VARCHAR(50) CHECK (review_decision IN (
        'NO_CHANGE_REQUIRED', 'REVISION_REQUIRED', 'OBSOLETE', 'EXTEND_REVIEW')),
    comments TEXT,
    next_review_date TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_version_id UUID NOT NULL REFERENCES document_versions(id),
    approver_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(100),
    approval_order INTEGER DEFAULT 0,
    decision VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (
        decision IN ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED')),
    comments TEXT,
    decision_date TIMESTAMPTZ,
    electronic_signature_id UUID REFERENCES electronic_signatures(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_distribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_version_id UUID NOT NULL REFERENCES document_versions(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    distribution_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_date TIMESTAMPTZ,
    training_required BOOLEAN NOT NULL DEFAULT false,
    training_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_version_id, recipient_id)
);

CREATE TABLE document_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_document_id UUID NOT NULL REFERENCES documents(id),
    target_document_id UUID NOT NULL REFERENCES documents(id),
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN (
        'REFERENCES', 'SUPERSEDES', 'SUPPLEMENTS', 'RELATED_TO', 'PARENT_OF', 'CHILD_OF')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_document_id, target_document_id, reference_type)
);

-- Document indexes
CREATE INDEX idx_doc_number ON documents(document_number);
CREATE INDEX idx_doc_status ON documents(status);
CREATE INDEX idx_doc_type ON documents(document_type);
CREATE INDEX idx_doc_dept ON documents(department_id);
CREATE INDEX idx_doc_owner ON documents(owner_id);
CREATE INDEX idx_doc_review_date ON documents(next_review_date);
CREATE INDEX idx_docver_document ON document_versions(document_id);
CREATE INDEX idx_docver_status ON document_versions(status);
CREATE INDEX idx_docrev_document ON document_reviews(document_id);
CREATE INDEX idx_docrev_status ON document_reviews(status);
CREATE INDEX idx_docrev_due ON document_reviews(review_due_date);
CREATE INDEX idx_docdist_recipient ON document_distribution(recipient_id);
CREATE INDEX idx_docdist_ack ON document_distribution(acknowledged);

-- Triggers
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── TRAINING MANAGEMENT ───────────────────────────────────────────────────

CREATE TABLE training_curricula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'GMP', 'SOP', 'SAFETY', 'REGULATORY', 'TECHNICAL',
        'ONBOARDING', 'REFRESHER', 'COMPETENCY')),
    training_type VARCHAR(50) NOT NULL CHECK (training_type IN (
        'CLASSROOM', 'ON_THE_JOB', 'SELF_STUDY', 'E_LEARNING',
        'WORKSHOP', 'ASSESSMENT', 'PRACTICAL_DEMONSTRATION')),
    department_id UUID REFERENCES departments(id),
    plant_site_id UUID REFERENCES plant_sites(id),
    owner_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
    duration_hours DECIMAL(5,1),
    passing_score INTEGER,
    max_attempts INTEGER DEFAULT 3,
    validity_months INTEGER,
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    regulatory_requirement VARCHAR(255),
    prerequisites TEXT,
    document_id UUID REFERENCES documents(id),
    effective_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE training_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id UUID NOT NULL REFERENCES training_curricula(id),
    assigned_to_id UUID NOT NULL REFERENCES users(id),
    assigned_by_id UUID NOT NULL REFERENCES users(id),
    assignment_reason VARCHAR(100) NOT NULL CHECK (assignment_reason IN (
        'NEW_HIRE', 'SOP_REVISION', 'PERIODIC_RETRAINING', 'DEVIATION_RELATED',
        'CAPA_RELATED', 'ROLE_CHANGE', 'REGULATORY_UPDATE', 'MANUAL')),
    due_date TIMESTAMPTZ NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (
        priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED' CHECK (
        status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED', 'WAIVED')),
    source_record_type VARCHAR(50),
    source_record_id UUID,
    source_record_number VARCHAR(50),
    completed_date TIMESTAMPTZ,
    score INTEGER,
    attempts INTEGER NOT NULL DEFAULT 0,
    certificate_number VARCHAR(100),
    expiry_date TIMESTAMPTZ,
    trainer_id UUID REFERENCES users(id),
    trainer_comments TEXT,
    trainee_comments TEXT,
    evidence_path VARCHAR(1000),
    flowable_process_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE training_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES application_roles(id),
    curriculum_id UUID NOT NULL REFERENCES training_curricula(id),
    department_id UUID REFERENCES departments(id),
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    frequency_months INTEGER,
    effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_training_matrix_unique
    ON training_matrix (role_id, curriculum_id, COALESCE(department_id, '00000000-0000-0000-0000-000000000000'::UUID));

CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id UUID NOT NULL REFERENCES training_curricula(id),
    session_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500),
    scheduled_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location VARCHAR(255),
    trainer_id UUID REFERENCES users(id),
    max_participants INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (
        status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE training_session_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id),
    attendee_id UUID NOT NULL REFERENCES users(id),
    assignment_id UUID REFERENCES training_assignments(id),
    attendance_status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED' CHECK (
        attendance_status IN ('REGISTERED', 'ATTENDED', 'ABSENT', 'EXCUSED')),
    score INTEGER,
    passed BOOLEAN,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, attendee_id)
);

-- Training indexes
CREATE INDEX idx_tc_code ON training_curricula(curriculum_code);
CREATE INDEX idx_tc_status ON training_curricula(status);
CREATE INDEX idx_tc_category ON training_curricula(category);
CREATE INDEX idx_ta_assignee ON training_assignments(assigned_to_id);
CREATE INDEX idx_ta_status ON training_assignments(status);
CREATE INDEX idx_ta_due ON training_assignments(due_date);
CREATE INDEX idx_ta_curriculum ON training_assignments(curriculum_id);
CREATE INDEX idx_tm_role ON training_matrix(role_id);
CREATE INDEX idx_tm_curriculum ON training_matrix(curriculum_id);
CREATE INDEX idx_ts_curriculum ON training_sessions(curriculum_id);
CREATE INDEX idx_ts_date ON training_sessions(scheduled_date);

-- Triggers
CREATE TRIGGER update_training_curricula_updated_at BEFORE UPDATE ON training_curricula
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_assignments_updated_at BEFORE UPDATE ON training_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sequence counters
INSERT INTO sequence_counters (sequence_name, year, current_value, prefix, format_pattern)
VALUES ('DOCUMENT', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'DOC', '{PREFIX}-{YEAR}-{SEQ:3}') ON CONFLICT DO NOTHING;
INSERT INTO sequence_counters (sequence_name, year, current_value, prefix, format_pattern)
VALUES ('TRAINING', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'TRN', '{PREFIX}-{YEAR}-{SEQ:3}') ON CONFLICT DO NOTHING;