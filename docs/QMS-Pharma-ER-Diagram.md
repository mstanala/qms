# QMS-Pharma Entity Relationship Diagram

**Version:** 1.0 | **Date:** 27-Jun-2026 | **Source:** Flyway migrations V1–V23

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Core & Auth Domain](#2-core--auth-domain)
3. [Deviation Management](#3-deviation-management)
4. [CAPA Management](#4-capa-management)
5. [Change Control Management](#5-change-control-management)
6. [Document Management](#6-document-management)
7. [Training Management](#7-training-management)
8. [Risk Management](#8-risk-management)
9. [Audit Management](#9-audit-management)
10. [Supplier Management](#10-supplier-management)
11. [Complaint Management](#11-complaint-management)
12. [Nonconformance Management](#12-nonconformance-management)
13. [Equipment Management](#13-equipment-management)
14. [Validation & Management Review](#14-validation--management-review)
15. [System & Shared Tables](#15-system--shared-tables)
16. [Complete Foreign Key Reference](#16-complete-foreign-key-reference)

---

## 1. Schema Overview

**Total Tables:** 70+ | **Database:** PostgreSQL 17 | **Schema Migrations:** Flyway V1–V23

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          QMS-PHARMA DATABASE                                │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│  Core/Auth   │  Quality     │  Compliance  │  Operations  │  System         │
│              │  Events      │              │              │                 │
│ organizations│ deviations   │ documents    │ equipment    │ audit_trail     │
│ plant_sites  │ capas        │ training_*   │ calibration  │ e_signatures    │
│ departments  │ complaints   │ audits       │ maintenance  │ workflow_history│
│ users        │ nonconform.  │ suppliers    │ validation_* │ notifications   │
│ roles/perms  │ change_reqs  │ risk_*       │ mgmt_reviews │ attachments     │
└──────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
```

---

## 2. Core & Auth Domain

```mermaid
erDiagram
    organizations {
        UUID id PK
        VARCHAR name
        VARCHAR code UK
        VARCHAR type "MANUFACTURER|CDMO|NUTRACEUTICAL|API_MANUFACTURER"
        VARCHAR address
        VARCHAR city
        VARCHAR state
        VARCHAR country "DEFAULT India"
        VARCHAR phone
        VARCHAR email
        VARCHAR gmp_certification "FDA|EU_GMP|WHO_GMP|SCHEDULE_M|NONE"
        VARCHAR license_number
        BOOLEAN is_active "DEFAULT TRUE"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    plant_sites {
        UUID id PK
        UUID organization_id FK
        VARCHAR name
        VARCHAR code
        VARCHAR address
        VARCHAR city
        VARCHAR state
        VARCHAR country
        VARCHAR site_type "MANUFACTURING|WAREHOUSE|LABORATORY|R_AND_D|OFFICE"
        VARCHAR fda_registration
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    departments {
        UUID id PK
        UUID plant_site_id FK
        VARCHAR name
        VARCHAR code
        VARCHAR description
        UUID parent_department_id FK "self-ref"
        BOOLEAN is_active
    }

    users {
        UUID id PK
        VARCHAR employee_id UK
        VARCHAR username UK
        VARCHAR email UK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR display_name "GENERATED"
        VARCHAR password_hash
        VARCHAR phone
        VARCHAR job_title
        VARCHAR user_type "OPERATOR|QA_SPECIALIST|QUALITY_MANAGER|..."
        UUID organization_id FK
        UUID plant_site_id FK
        UUID department_id FK
        UUID manager_id FK "self-ref"
        BOOLEAN is_active
        BOOLEAN is_locked
        INTEGER failed_login_count
        TIMESTAMPTZ last_login_at
        TIMESTAMPTZ last_password_change
        BOOLEAN must_change_password
        UUID created_by FK
        UUID updated_by FK
    }

    security_profiles {
        UUID id PK
        VARCHAR name UK
        VARCHAR description
        BOOLEAN is_system
        BOOLEAN is_active
    }

    application_roles {
        UUID id PK
        VARCHAR name UK
        VARCHAR code UK
        VARCHAR description
        VARCHAR role_level "END_USER|OWNER|REVIEWER|APPROVER|..."
        BOOLEAN is_system
        BOOLEAN is_active
    }

    permissions {
        UUID id PK
        VARCHAR module "CAPA|DEVIATION|CHANGE_CONTROL|DOCUMENT|..."
        VARCHAR action "CREATE|READ|UPDATE|DELETE|APPROVE|..."
        VARCHAR resource
    }

    role_permissions {
        UUID id PK
        UUID role_id FK
        UUID permission_id FK
    }

    user_roles {
        UUID id PK
        UUID user_id FK
        UUID role_id FK
        UUID plant_site_id FK
        UUID assigned_by FK
        TIMESTAMPTZ valid_from
        TIMESTAMPTZ valid_until
        BOOLEAN is_active
    }

    user_security_profiles {
        UUID id PK
        UUID user_id FK
        UUID security_profile_id FK
        UUID assigned_by FK
    }

    security_profile_permissions {
        UUID id PK
        UUID security_profile_id FK
        UUID permission_id FK
    }

    user_login_audit {
        UUID id PK
        UUID user_id FK
        VARCHAR username
        VARCHAR login_status "SUCCESS|FAILED|LOCKED_OUT|SESSION_EXPIRED"
        VARCHAR ip_address
        VARCHAR user_agent
        VARCHAR session_id
    }

    organizations ||--o{ plant_sites : "has"
    plant_sites ||--o{ departments : "contains"
    departments ||--o{ departments : "parent"
    organizations ||--o{ users : "employs"
    plant_sites ||--o{ users : "located_at"
    departments ||--o{ users : "belongs_to"
    users ||--o{ users : "manages"
    application_roles ||--o{ role_permissions : "grants"
    permissions ||--o{ role_permissions : "assigned_via"
    users ||--o{ user_roles : "has"
    application_roles ||--o{ user_roles : "assigned_to"
    users ||--o{ user_security_profiles : "has"
    security_profiles ||--o{ user_security_profiles : "assigned_to"
    security_profiles ||--o{ security_profile_permissions : "includes"
    permissions ||--o{ security_profile_permissions : "granted_via"
    users ||--o{ user_login_audit : "logs"
```

---

## 3. Deviation Management

```mermaid
erDiagram
    deviations {
        UUID id PK
        VARCHAR deviation_number UK
        VARCHAR title
        TEXT description
        VARCHAR type "PLANNED|UNPLANNED"
        VARCHAR category "PROCESS|EQUIPMENT|MATERIAL|..."
        VARCHAR classification "CRITICAL|MAJOR|MINOR"
        VARCHAR status "REPORTED|UNDER_REVIEW|CLASSIFIED|..."
        VARCHAR source_area
        TIMESTAMPTZ occurred_date
        TIMESTAMPTZ reported_date
        TIMESTAMPTZ detected_date
        TIMESTAMPTZ target_closure_date
        TIMESTAMPTZ actual_closure_date
        UUID reported_by_id FK
        UUID assigned_to_id FK
        UUID reviewer_id FK
        UUID approved_by_id FK
        UUID plant_site_id FK
        UUID department_id FK
        VARCHAR product
        VARCHAR batch_number
        BOOLEAN gmp_impact
        BOOLEAN patient_safety_impact
        BOOLEAN regulatory_impact
        BOOLEAN capa_required
        UUID capa_id FK
        VARCHAR current_workflow_step
        VARCHAR flowable_process_id
        INTEGER version
    }

    deviation_affected_batches {
        UUID id PK
        UUID deviation_id FK
        VARCHAR batch_number
        VARCHAR product_name
        VARCHAR impact_description
        VARCHAR disposition "RELEASE|REPROCESS|REWORK|REJECT|QUARANTINE|..."
    }

    deviation_investigations {
        UUID id PK
        UUID deviation_id FK "UNIQUE"
        UUID investigator_id FK
        TIMESTAMPTZ start_date
        TIMESTAMPTZ completed_date
        TEXT probable_cause
        TEXT root_cause
        TEXT findings
        TEXT conclusion
        VARCHAR method
    }

    deviation_immediate_actions {
        UUID id PK
        UUID investigation_id FK
        TEXT action_description
        INTEGER action_order
    }

    deviation_impact_assessments {
        UUID id PK
        UUID deviation_id FK "UNIQUE"
        VARCHAR product_quality_impact "NONE|LOW|MEDIUM|HIGH|CRITICAL"
        VARCHAR patient_safety_impact "NONE|LOW|MEDIUM|HIGH|CRITICAL"
        VARCHAR regulatory_impact "NONE|LOW|MEDIUM|HIGH|CRITICAL"
        VARCHAR business_impact "NONE|LOW|MEDIUM|HIGH|CRITICAL"
        VARCHAR overall_risk_level "LOW|MEDIUM|HIGH|CRITICAL"
        TEXT justification
        UUID assessed_by_id FK
    }

    deviation_dispositions {
        UUID id PK
        UUID deviation_id FK "UNIQUE"
        VARCHAR decision "RELEASE|REPROCESS|REWORK|REJECT|..."
        TEXT justification
        TEXT conditions
        UUID approved_by_id FK
    }

    deviations ||--o{ deviation_affected_batches : "affects"
    deviations ||--o| deviation_investigations : "investigated_by"
    deviations ||--o| deviation_impact_assessments : "assessed_by"
    deviations ||--o| deviation_dispositions : "disposed_by"
    deviation_investigations ||--o{ deviation_immediate_actions : "includes"
    users ||--o{ deviations : "reported_by"
    plant_sites ||--o{ deviations : "occurred_at"
    departments ||--o{ deviations : "belongs_to"
    deviations }o--o| capas : "linked_to"
```

---

## 4. CAPA Management

```mermaid
erDiagram
    capas {
        UUID id PK
        VARCHAR capa_number UK
        VARCHAR title
        TEXT description
        VARCHAR type "CORRECTIVE|PREVENTIVE|CORRECTIVE_AND_PREVENTIVE"
        VARCHAR status "INITIATED|UNDER_REVIEW|INVESTIGATION|..."
        VARCHAR priority "CRITICAL|HIGH|MEDIUM|LOW"
        VARCHAR source_type "DEVIATION|AUDIT_FINDING|COMPLAINT|..."
        VARCHAR source_reference
        TIMESTAMPTZ initiated_date
        TIMESTAMPTZ target_completion_date
        TIMESTAMPTZ actual_completion_date
        TIMESTAMPTZ due_date
        UUID initiator_id FK
        UUID owner_id FK
        UUID department_id FK
        UUID plant_site_id FK
        VARCHAR product
        VARCHAR batch_number
        UUID deviation_id FK
        VARCHAR current_workflow_step
        VARCHAR flowable_process_id
        INTEGER version
    }

    capa_root_cause_analyses {
        UUID id PK
        UUID capa_id FK "UNIQUE"
        VARCHAR method "FIVE_WHY|FISHBONE|FAULT_TREE|PARETO|FAILURE_MODE"
        TEXT description
        TEXT_ARRAY root_causes
        TEXT_ARRAY contributing_factors
        VARCHAR fishbone_diagram_url
        UUID completed_by_id FK
    }

    capa_five_why_entries {
        UUID id PK
        UUID rca_id FK
        INTEGER level "1-7"
        TEXT question
        TEXT answer
    }

    capa_fishbone_categories {
        UUID id PK
        UUID rca_id FK
        VARCHAR category_name
        TEXT_ARRAY causes
    }

    capa_risk_assessments {
        UUID id PK
        UUID capa_id FK "UNIQUE"
        INTEGER severity "1-5"
        INTEGER occurrence "1-5"
        INTEGER detection "1-5"
        INTEGER rpn "GENERATED severity*occurrence*detection"
        VARCHAR risk_level "LOW|MEDIUM|HIGH|CRITICAL"
        TEXT justification
        UUID assessed_by_id FK
    }

    capa_actions {
        UUID id PK
        UUID capa_id FK
        VARCHAR action_number
        TEXT description
        VARCHAR type "CORRECTIVE|PREVENTIVE"
        VARCHAR status "PENDING|IN_PROGRESS|COMPLETED|VERIFIED|OVERDUE"
        UUID assigned_to_id FK
        TIMESTAMPTZ due_date
        TIMESTAMPTZ completed_date
        TEXT evidence
        UUID verified_by_id FK
    }

    capa_effectiveness_checks {
        UUID id PK
        UUID capa_id FK "UNIQUE"
        VARCHAR method "DATA_TRENDING|AUDIT|TESTING|..."
        TEXT description
        TIMESTAMPTZ check_date
        UUID confirmed_by_id FK
        BOOLEAN is_effective
        TEXT issues_found
    }

    capas ||--o| capa_root_cause_analyses : "analyzed_by"
    capas ||--o| capa_risk_assessments : "risk_assessed"
    capas ||--o{ capa_actions : "has_actions"
    capas ||--o| capa_effectiveness_checks : "effectiveness"
    capa_root_cause_analyses ||--o{ capa_five_why_entries : "five_why"
    capa_root_cause_analyses ||--o{ capa_fishbone_categories : "fishbone"
    users ||--o{ capas : "initiator/owner"
    departments ||--o{ capas : "belongs_to"
    plant_sites ||--o{ capas : "site"
    deviations ||--o{ capas : "triggers"
```

---

## 5. Change Control Management

```mermaid
erDiagram
    change_requests {
        UUID id PK
        VARCHAR change_number UK
        VARCHAR title
        TEXT description
        TEXT reason
        VARCHAR type "ENGINEERING|BUSINESS|PROCESS|SITE|PRODUCT"
        VARCHAR impact_level "NO_IMPACT|LOW|MEDIUM|HIGH|CRITICAL"
        VARCHAR status "INITIATED|UNDER_REVIEW|AWAITING_APPROVAL|..."
        VARCHAR priority "CRITICAL|HIGH|MEDIUM|LOW"
        VARCHAR change_category "PREVENTIVE|CORRECTIVE|IMPROVEMENT|..."
        TIMESTAMPTZ target_implementation_date
        TIMESTAMPTZ actual_implementation_date
        TEXT justification
        UUID initiator_id FK
        UUID owner_id FK
        UUID department_id FK
        UUID plant_site_id FK
        VARCHAR current_workflow_step
        VARCHAR flowable_process_id
        INTEGER version
    }

    change_impact_assessments {
        UUID id PK
        UUID change_id FK "UNIQUE"
        VARCHAR product_impact
        VARCHAR process_impact
        VARCHAR equipment_impact
        VARCHAR documentation_impact
        BOOLEAN training_required
        BOOLEAN regulatory_filing_required
        DECIMAL cost_estimate
        TEXT assessment_summary
        UUID assessed_by_id FK
    }

    change_regulatory_filings {
        UUID id PK
        UUID change_id FK
        VARCHAR filing_type "IND|BLA|ANDA|NDA|DMF|ANNUAL_REPORT"
        VARCHAR regulatory_body
        VARCHAR status "SUBMITTED|ACCEPTED|APPROVED|REJECTED|..."
    }

    change_affected_documents {
        UUID id PK
        UUID change_id FK
        UUID document_id FK
        VARCHAR action "CREATE|UPDATE|REVOKE|ARCHIVE"
    }

    change_affected_products {
        UUID id PK
        UUID change_id FK
        VARCHAR product_name
        VARCHAR market "DOMESTIC|EXPORT|USA|EU|OTHER"
        TEXT impact_description
    }

    change_implementation_tasks {
        UUID id PK
        UUID change_id FK
        TEXT task_description
        UUID assigned_to_id FK
        TIMESTAMPTZ due_date
        TIMESTAMPTZ completed_date
        VARCHAR status "PENDING|IN_PROGRESS|COMPLETED|OVERDUE|ON_HOLD"
        INTEGER percentage_complete
    }

    change_training_requirements {
        UUID id PK
        UUID change_id FK
        TEXT training_scope
        TEXT_ARRAY affected_roles
        VARCHAR training_type
        VARCHAR status "PLANNED|IN_PROGRESS|COMPLETED|DEFERRED"
    }

    change_approvals {
        UUID id PK
        UUID change_id FK
        UUID approver_id FK
        VARCHAR role
        INTEGER approval_order
        VARCHAR decision "PENDING|APPROVED|REJECTED|RETURNED"
        TEXT comments
    }

    change_effectiveness_reviews {
        UUID id PK
        UUID change_id FK "UNIQUE"
        TIMESTAMPTZ review_date
        UUID reviewer_id FK
        BOOLEAN is_effective
        TEXT issues_identified
    }

    change_effectiveness_criteria {
        UUID id PK
        UUID change_id FK
        TEXT criteria_description
        VARCHAR measurement_method
        VARCHAR expected_value
        VARCHAR actual_value
        BOOLEAN met
    }

    change_requests ||--o| change_impact_assessments : "assessed_by"
    change_requests ||--o{ change_regulatory_filings : "filed"
    change_requests ||--o{ change_affected_documents : "affects_docs"
    change_requests ||--o{ change_affected_products : "affects_products"
    change_requests ||--o{ change_implementation_tasks : "tasks"
    change_requests ||--o{ change_training_requirements : "training"
    change_requests ||--o{ change_approvals : "approved_by"
    change_requests ||--o| change_effectiveness_reviews : "reviewed"
    change_requests ||--o{ change_effectiveness_criteria : "criteria"
    users ||--o{ change_requests : "initiator/owner"
    departments ||--o{ change_requests : "dept"
    plant_sites ||--o{ change_requests : "site"
```

---

## 6. Document Management

```mermaid
erDiagram
    documents {
        UUID id PK
        VARCHAR document_number UK
        VARCHAR title
        TEXT description
        VARCHAR document_type "SOP|WORK_INSTRUCTION|BATCH_RECORD|..."
        VARCHAR category
        VARCHAR sub_category
        UUID department_id FK
        UUID plant_site_id FK
        UUID owner_id FK
        VARCHAR status "DRAFT|PENDING_REVIEW|UNDER_REVIEW|..."
        VARCHAR current_version
        UUID current_version_id FK "DEFERRABLE"
        TIMESTAMPTZ effective_date
        TIMESTAMPTZ expiry_date
        TIMESTAMPTZ next_review_date
        INTEGER review_period_months "DEFAULT 24"
        VARCHAR confidentiality_level "PUBLIC|INTERNAL|CONFIDENTIAL|RESTRICTED"
        UUID template_id FK "self-ref"
        BOOLEAN is_template
        VARCHAR flowable_process_id
        VARCHAR current_workflow_step
        INTEGER version
    }

    document_versions {
        UUID id PK
        UUID document_id FK
        VARCHAR version_number
        INTEGER major_version
        INTEGER minor_version
        TEXT change_description
        VARCHAR change_type "NEW|MINOR_REVISION|MAJOR_REVISION|..."
        VARCHAR status "DRAFT|UNDER_REVIEW|APPROVED|EFFECTIVE|..."
        VARCHAR file_path
        VARCHAR file_name
        BIGINT file_size
        VARCHAR content_hash
        UUID author_id FK
        UUID reviewer_id FK
        UUID approver_id FK
    }

    document_reviews {
        UUID id PK
        UUID document_id FK
        VARCHAR review_type "PERIODIC|TRIGGERED|INITIAL"
        TIMESTAMPTZ review_due_date
        UUID reviewer_id FK
        VARCHAR review_decision "NO_CHANGE_REQUIRED|REVISION_REQUIRED|..."
        VARCHAR status "PENDING|IN_PROGRESS|COMPLETED|OVERDUE"
    }

    document_approvals {
        UUID id PK
        UUID document_version_id FK
        UUID approver_id FK
        VARCHAR role
        INTEGER approval_order
        VARCHAR decision "PENDING|APPROVED|REJECTED|RETURNED"
        UUID electronic_signature_id FK
    }

    document_distribution {
        UUID id PK
        UUID document_version_id FK
        UUID recipient_id FK
        UUID department_id FK
        BOOLEAN acknowledged "DEFAULT FALSE"
        BOOLEAN training_required "DEFAULT FALSE"
        BOOLEAN training_completed "DEFAULT FALSE"
    }

    document_references {
        UUID id PK
        UUID source_document_id FK
        UUID target_document_id FK
        VARCHAR reference_type "REFERENCES|SUPERSEDES|SUPPLEMENTS|..."
    }

    documents ||--o{ document_versions : "has_versions"
    documents ||--o{ document_reviews : "reviewed"
    documents ||--o{ document_references : "references"
    documents ||--o{ document_references : "referenced_by"
    document_versions ||--o{ document_approvals : "approvals"
    document_versions ||--o{ document_distribution : "distributed_to"
    users ||--o{ documents : "owned_by"
    departments ||--o{ documents : "dept"
    plant_sites ||--o{ documents : "site"
```

---

## 7. Training Management

```mermaid
erDiagram
    training_curricula {
        UUID id PK
        VARCHAR curriculum_code UK
        VARCHAR title
        TEXT description
        VARCHAR category "GMP|SOP|SAFETY|REGULATORY|TECHNICAL|..."
        VARCHAR training_type "CLASSROOM|ON_THE_JOB|SELF_STUDY|E_LEARNING|..."
        UUID department_id FK
        UUID plant_site_id FK
        UUID owner_id FK
        VARCHAR status "DRAFT|ACTIVE|INACTIVE|ARCHIVED"
        DECIMAL duration_hours
        INTEGER passing_score
        INTEGER max_attempts "DEFAULT 3"
        INTEGER validity_months
        BOOLEAN is_mandatory
        VARCHAR regulatory_requirement
        TEXT prerequisites
        UUID document_id FK
        TIMESTAMPTZ effective_date
        INTEGER version
    }

    training_assignments {
        UUID id PK
        UUID curriculum_id FK
        UUID assigned_to_id FK
        UUID assigned_by_id FK
        VARCHAR assignment_reason "NEW_HIRE|SOP_REVISION|PERIODIC_RETRAINING|..."
        TIMESTAMPTZ due_date
        VARCHAR priority "LOW|MEDIUM|HIGH|CRITICAL"
        VARCHAR status "ASSIGNED|IN_PROGRESS|COMPLETED|OVERDUE|CANCELLED|WAIVED"
        VARCHAR source_record_type
        UUID source_record_id
        VARCHAR source_record_number
        TIMESTAMPTZ completed_date
        INTEGER score
        INTEGER attempts "DEFAULT 0"
        UUID trainer_id FK
        TEXT trainer_comments
        TEXT trainee_comments
        VARCHAR flowable_process_id
    }

    training_matrix {
        UUID id PK
        UUID role_id FK
        UUID curriculum_id FK
        UUID department_id FK
        BOOLEAN is_mandatory "DEFAULT TRUE"
        INTEGER frequency_months
        TIMESTAMPTZ effective_date
    }

    training_sessions {
        UUID id PK
        UUID curriculum_id FK
        VARCHAR session_code UK
        VARCHAR title
        TIMESTAMPTZ scheduled_date
        TIMESTAMPTZ end_date
        VARCHAR location
        UUID trainer_id FK
        INTEGER max_participants
        VARCHAR status "SCHEDULED|IN_PROGRESS|COMPLETED|CANCELLED"
    }

    training_session_attendees {
        UUID id PK
        UUID session_id FK
        UUID attendee_id FK
        UUID assignment_id FK
        VARCHAR attendance_status "REGISTERED|ATTENDED|ABSENT|EXCUSED"
        INTEGER score
        BOOLEAN passed
    }

    training_curricula ||--o{ training_assignments : "assigned"
    training_curricula ||--o{ training_matrix : "matrix"
    training_curricula ||--o{ training_sessions : "sessions"
    training_sessions ||--o{ training_session_attendees : "attendees"
    application_roles ||--o{ training_matrix : "role"
    users ||--o{ training_assignments : "assigned_to"
    users ||--o{ training_assignments : "assigned_by"
    documents ||--o{ training_curricula : "related_doc"
```

---

## 8. Risk Management

```mermaid
erDiagram
    risk_registers {
        UUID id PK
        VARCHAR risk_number UK
        VARCHAR title
        TEXT description
        VARCHAR risk_area "PROCESS|PRODUCT|EQUIPMENT|MATERIAL|..."
        VARCHAR risk_category "GMP_COMPLIANCE|PRODUCT_QUALITY|..."
        VARCHAR risk_type "OPERATIONAL|STRATEGIC|COMPLIANCE|FINANCIAL"
        INTEGER severity "1-5"
        INTEGER occurrence "1-5"
        INTEGER detection "1-5"
        INTEGER initial_rpn
        INTEGER residual_rpn
        VARCHAR status "DRAFT|IN_ASSESSMENT|EVALUATION|..."
        VARCHAR priority
        UUID owner_id FK
        UUID department_id FK
        UUID plant_site_id FK
        VARCHAR current_workflow_step
        VARCHAR flowable_process_id
        INTEGER version
    }

    risk_assessments {
        UUID id PK
        UUID risk_register_id FK "UNIQUE"
        INTEGER probability "1-5"
        INTEGER impact "1-5"
        VARCHAR risk_level "TRIVIAL|LOW|MEDIUM|HIGH|CRITICAL"
        TEXT_ARRAY existing_controls
        VARCHAR control_effectiveness "HIGH|MEDIUM|LOW|NONE"
        TIMESTAMPTZ assessment_date
        UUID assessed_by_id FK
    }

    risk_controls {
        UUID id PK
        UUID risk_register_id FK
        VARCHAR control_number
        TEXT description
        VARCHAR control_type "DETECTIVE|PREVENTIVE|MITIGATING"
        VARCHAR effectiveness "HIGH|MEDIUM|LOW|NONE"
        VARCHAR target_residual_risk
        UUID owner_id FK
        TIMESTAMPTZ implementation_date
        BOOLEAN is_effective
    }

    risk_reviews {
        UUID id PK
        UUID risk_register_id FK
        VARCHAR review_type "ANNUAL|PERIODIC|TRIGGERED|FOR_CAUSE"
        TIMESTAMPTZ review_date
        UUID reviewer_id FK
        VARCHAR current_status "APPROVED|NEEDS_REVISION|REQUIRES_ACTION|COMPLETED"
        TEXT residual_risk_assessment
        TIMESTAMPTZ next_review_date
    }

    risk_registers ||--o| risk_assessments : "assessed"
    risk_registers ||--o{ risk_controls : "controlled_by"
    risk_registers ||--o{ risk_reviews : "reviewed"
    users ||--o{ risk_registers : "owned_by"
    departments ||--o{ risk_registers : "dept"
    plant_sites ||--o{ risk_registers : "site"
```

---

## 9. Audit Management

```mermaid
erDiagram
    audit_plans {
        UUID id PK
        VARCHAR plan_number UK
        VARCHAR title
        TEXT description
        INTEGER plan_year
        VARCHAR audit_type "INTERNAL|EXTERNAL|SUPPLIER|REGULATORY|..."
        VARCHAR status "DRAFT|IN_PROGRESS|APPROVED|COMPLETED|CANCELLED"
        UUID owner_id FK
        UUID plant_site_id FK
        UUID created_by FK
        UUID updated_by FK
    }

    audits {
        UUID id PK
        VARCHAR audit_number UK
        UUID audit_plan_id FK
        VARCHAR title
        TEXT description
        VARCHAR audit_type "INTERNAL|EXTERNAL|SUPPLIER|..."
        TEXT audit_scope
        VARCHAR status "PLANNED|SCHEDULED|IN_PROGRESS|REPORT_DRAFTING|..."
        VARCHAR priority "LOW|MEDIUM|HIGH|CRITICAL"
        VARCHAR category
        TEXT executive_summary
        TEXT findings_summary
        VARCHAR frequency "ANNUAL|SEMI_ANNUAL|QUARTERLY|..."
        VARCHAR lifecycle_state "DRAFT|ACTIVE|UNDER_REVIEW|APPROVED|..."
        TIMESTAMPTZ scheduled_start_date
        TIMESTAMPTZ scheduled_end_date
        TIMESTAMPTZ actual_start_date
        TIMESTAMPTZ actual_end_date
        UUID lead_auditor_id FK
        UUID auditee_department_id FK
        UUID auditee_contact_id FK
        UUID plant_site_id FK
        VARCHAR current_workflow_step
        VARCHAR flowable_process_id
    }

    audit_team_members {
        UUID id PK
        UUID audit_id FK
        UUID user_id FK
        VARCHAR role "LEAD_AUDITOR|AUDITOR|TECHNICAL_EXPERT|..."
    }

    audit_checklists {
        UUID id PK
        UUID audit_id FK
        VARCHAR checklist_code
        VARCHAR title
        INTEGER total_questions
        INTEGER completed_questions
        VARCHAR status "DRAFT|IN_PROGRESS|COMPLETED"
    }

    audit_checklist_items {
        UUID id PK
        UUID checklist_id FK
        INTEGER item_number
        TEXT question
        VARCHAR response "YES|NO|NA|PARTIAL"
        TEXT observations
        VARCHAR item_status "PENDING|ANSWERED|EVIDENCE_ATTACHED|VERIFIED"
    }

    audit_findings {
        UUID id PK
        UUID audit_id FK
        VARCHAR finding_number
        VARCHAR title
        TEXT description
        VARCHAR classification "OBSERVATION|MINOR|MAJOR|CRITICAL"
        VARCHAR area
        VARCHAR standard_reference
        TEXT objective_evidence
        VARCHAR status "OPEN|ACKNOWLEDGED|IN_PROGRESS|CAPA_ASSIGNED|..."
        BOOLEAN capa_required
    }

    audit_plans ||--o{ audits : "schedules"
    audits ||--o{ audit_team_members : "team"
    audits ||--o{ audit_checklists : "checklists"
    audits ||--o{ audit_findings : "findings"
    audit_checklists ||--o{ audit_checklist_items : "items"
    users ||--o{ audits : "lead_auditor"
    departments ||--o{ audits : "auditee_dept"
    plant_sites ||--o{ audits : "site"
```

---

## 10. Supplier Management

```mermaid
erDiagram
    suppliers {
        UUID id PK
        VARCHAR supplier_number UK
        VARCHAR name
        VARCHAR code UK
        VARCHAR supplier_type "RAW_MATERIAL|API|PACKAGING|..."
        VARCHAR contact_person
        VARCHAR phone
        VARCHAR email
        VARCHAR address
        VARCHAR city
        VARCHAR country
        VARCHAR status "PENDING_QUALIFICATION|UNDER_EVALUATION|..."
        VARCHAR classification "CRITICAL|MAJOR|MINOR"
        DECIMAL quality_rating
        TIMESTAMPTZ approval_date
        TIMESTAMPTZ last_audit_date
        UUID owner_id FK
        UUID plant_site_id FK
        VARCHAR current_workflow_step
        VARCHAR flowable_process_id
    }

    supplier_qualifications {
        UUID id PK
        UUID supplier_id FK
        VARCHAR qualification_number
        TIMESTAMPTZ audit_date
        UUID auditor_id FK
        VARCHAR status "AUDIT_SCHEDULED|AUDIT_COMPLETED|APPROVED|..."
        TEXT audit_scope
        TEXT findings_summary
    }

    supplier_scorecards {
        UUID id PK
        UUID supplier_id FK
        VARCHAR evaluation_period
        DECIMAL quality_score
        DECIMAL delivery_score
        DECIMAL compliance_score
        DECIMAL communication_score
        DECIMAL overall_score
        UUID evaluated_by_id FK
    }

    supplier_materials {
        UUID id PK
        UUID supplier_id FK
        VARCHAR material_code
        VARCHAR material_name
        VARCHAR material_grade
        BOOLEAN coa_required
        INTEGER lead_time_days
    }

    suppliers ||--o{ supplier_qualifications : "qualified"
    suppliers ||--o{ supplier_scorecards : "scored"
    suppliers ||--o{ supplier_materials : "supplies"
    users ||--o{ suppliers : "owned_by"
    plant_sites ||--o{ suppliers : "site"
```

---

## 11. Complaint Management

```mermaid
erDiagram
    complaints {
        UUID id PK
        VARCHAR complaint_number UK
        VARCHAR source "CUSTOMER|DISTRIBUTOR|COMPLAINT_HOTLINE|..."
        VARCHAR source_reference
        TIMESTAMPTZ complaint_date
        TIMESTAMPTZ received_date
        VARCHAR product_name
        VARCHAR batch_number
        VARCHAR market "DOMESTIC|EXPORT|USA|EU|OTHER"
        TEXT complaint_description
        VARCHAR product_defect "QUALITY|PACKAGING|LABELING|DELIVERY|DOCUMENT"
        VARCHAR safety_impact "SERIOUS|POTENTIAL|NONE|ADVERSE_EVENT"
        VARCHAR severity_classification "CRITICAL|MAJOR|MINOR|INFORMATIONAL"
        VARCHAR status "RECEIVED|CLASSIFIED|UNDER_INVESTIGATION|..."
        VARCHAR recall_assessment "NOT_REQUIRED|NO_RECALL|..."
        TEXT investigation_summary
        TEXT root_cause
        TEXT proposed_remedy
        UUID owner_id FK
        UUID plant_site_id FK
        VARCHAR current_workflow_step
        VARCHAR flowable_process_id
    }

    complaint_samples {
        UUID id PK
        UUID complaint_id FK
        VARCHAR sample_reference
        VARCHAR testing_status "NOT_REQUIRED|RECEIVED|IN_PROGRESS|COMPLETED"
        TEXT test_results
        BOOLEAN retesting_required
    }

    complaint_trending {
        UUID id PK
        DATE month
        INTEGER total_complaints
        VARCHAR product_name
        VARCHAR defect_type
        VARCHAR severity
        TEXT trend_analysis
        UUID owner_id FK
    }

    complaints ||--o{ complaint_samples : "samples"
    users ||--o{ complaints : "owned_by"
    plant_sites ||--o{ complaints : "site"
```

---

## 12. Nonconformance Management

```mermaid
erDiagram
    nonconformances {
        UUID id PK
        VARCHAR nc_number UK
        VARCHAR title
        TEXT description
        VARCHAR stage_detected "INCOMING|IN_PROCESS|FINAL_PRODUCT|STABILITY|MARKET"
        VARCHAR nature_of_nonconformance "SPECIFICATION|PROCEDURE|DOCUMENTATION|..."
        VARCHAR severity "CRITICAL|MAJOR|MINOR"
        VARCHAR status "IDENTIFIED|QUARANTINED|UNDER_REVIEW|..."
        VARCHAR quarantine_decision "RELEASED|CONDITIONALLY_RELEASED|REWORK|SCRAP|HOLD"
        VARCHAR source_record_type
        UUID source_record_id
        BOOLEAN investigation_required
        TEXT root_cause
        BOOLEAN corrective_action_required
        UUID owner_id FK
        UUID investigator_id FK
        UUID department_id FK
        UUID plant_site_id FK
        TIMESTAMPTZ detected_date
        TIMESTAMPTZ due_date
        TIMESTAMPTZ closure_date
        VARCHAR current_workflow_step
        VARCHAR flowable_process_id
    }

    nonconformances }o--|| users : "owned_by"
    nonconformances }o--o| users : "investigated_by"
    nonconformances }o--|| departments : "dept"
    nonconformances }o--|| plant_sites : "site"
```

---

## 13. Equipment Management

```mermaid
erDiagram
    equipment {
        UUID id PK
        VARCHAR equipment_number UK
        VARCHAR equipment_name
        VARCHAR equipment_type "MANUFACTURING|LABORATORY|UTILITY|..."
        VARCHAR equipment_class "CLASS_A|CLASS_B|CLASS_C"
        VARCHAR manufacturer
        VARCHAR model
        VARCHAR serial_number
        VARCHAR location
        UUID plant_site_id FK
        UUID department_id FK
        VARCHAR status "ACTIVE|INACTIVE|UNDER_MAINTENANCE|..."
        VARCHAR qualification_status "NOT_QUALIFIED|IQ_COMPLETED|OQ_COMPLETED|..."
        TIMESTAMPTZ qualification_expiry_date
        VARCHAR calibration_status "CALIBRATED|DUE|OVERDUE|NOT_APPLICABLE|..."
        DATE last_calibration_date
        DATE next_calibration_date
        VARCHAR criticality "CRITICAL|MAJOR|MINOR"
        UUID owner_id FK
        VARCHAR flowable_process_id
    }

    calibration_records {
        UUID id PK
        UUID equipment_id FK
        VARCHAR calibration_number UK
        VARCHAR calibration_type "ROUTINE|INITIAL|POST_REPAIR|..."
        VARCHAR internal_external "INTERNAL|EXTERNAL"
        TIMESTAMPTZ calibration_date
        TIMESTAMPTZ due_date
        UUID calibrated_by_id FK
        VARCHAR status "SCHEDULED|COMPLETED|OVERDUE|FAILED"
        BOOLEAN in_tolerance
        VARCHAR tolerance_limits
        VARCHAR actual_values
    }

    maintenance_records {
        UUID id PK
        UUID equipment_id FK
        VARCHAR maintenance_number
        VARCHAR maintenance_type "PREVENTIVE|BREAKDOWN|PREDICTIVE"
        TEXT description
        TIMESTAMPTZ scheduled_date
        TIMESTAMPTZ actual_completion_date
        VARCHAR status "SCHEDULED|IN_PROGRESS|COMPLETED|DEFERRED"
        DECIMAL downtime_hours
        UUID created_by FK
    }

    equipment ||--o{ calibration_records : "calibrated"
    equipment ||--o{ maintenance_records : "maintained"
    plant_sites ||--o{ equipment : "located_at"
    departments ||--o{ equipment : "dept"
    users ||--o{ equipment : "owned_by"
```

---

## 14. Validation & Management Review

```mermaid
erDiagram
    validation_projects {
        UUID id PK
        VARCHAR validation_number UK
        VARCHAR title
        TEXT scope
        TEXT purpose
        VARCHAR status "PLANNED|PROTOCOL_DEVELOPMENT|EXECUTION|..."
        VARCHAR priority "LOW|MEDIUM|HIGH|CRITICAL"
        UUID owner_id FK
        UUID plant_site_id FK
    }

    validation_requirements {
        UUID id PK
        UUID project_id FK
        VARCHAR requirement_number
        TEXT description
        VARCHAR requirement_type "FUNCTIONAL|DESIGN|USER"
        UUID responsible_party_id FK
        VARCHAR status "DRAFT|ACTIVE|SATISFIED|SUPERSEDED"
    }

    validation_test_protocols {
        UUID id PK
        UUID project_id FK
        VARCHAR protocol_number UK
        VARCHAR title
        TEXT test_objective
        TEXT acceptance_criteria
        VARCHAR protocol_status "DRAFT|APPROVED|EXECUTED|REJECTED"
        UUID approved_by_id FK
    }

    validation_test_cases {
        UUID id PK
        UUID protocol_id FK
        VARCHAR test_case_number
        TEXT test_description
        TEXT expected_result
        TEXT actual_result
        VARCHAR test_result "PASS|FAIL|NOT_EXECUTED"
        UUID executed_by_id FK
    }

    validation_traceability {
        UUID id PK
        UUID project_id FK
        UUID requirement_id FK
        UUID test_protocol_id FK
        VARCHAR traceability_status "MAPPED|SATISFIED|REJECTED"
    }

    management_reviews {
        UUID id PK
        VARCHAR review_number UK
        TIMESTAMPTZ review_date
        VARCHAR review_period
        TEXT scope
        VARCHAR status "PLANNED|IN_PROGRESS|COMPLETED|PENDING_APPROVAL"
        UUID owner_id FK
        UUID plant_site_id FK
    }

    management_review_attendees {
        UUID id PK
        UUID review_id FK
        UUID attendee_id FK
        VARCHAR attendance_status "PRESENT|ABSENT|EXCUSED"
    }

    management_review_metrics {
        UUID id PK
        UUID review_id FK
        VARCHAR metric_name
        DECIMAL metric_value
        DECIMAL target_value
    }

    management_review_actions {
        UUID id PK
        UUID review_id FK
        TEXT action_description
        UUID assigned_to_id FK
        TIMESTAMPTZ due_date
        VARCHAR status "PENDING|IN_PROGRESS|COMPLETED|OVERDUE"
    }

    validation_projects ||--o{ validation_requirements : "requires"
    validation_projects ||--o{ validation_test_protocols : "protocols"
    validation_projects ||--o{ validation_traceability : "traced"
    validation_test_protocols ||--o{ validation_test_cases : "test_cases"
    management_reviews ||--o{ management_review_attendees : "attendees"
    management_reviews ||--o{ management_review_metrics : "metrics"
    management_reviews ||--o{ management_review_actions : "actions"
```

---

## 15. System & Shared Tables

```mermaid
erDiagram
    electronic_signatures {
        UUID id PK
        UUID user_id FK
        VARCHAR record_type
        UUID record_id
        VARCHAR action
        VARCHAR meaning
        VARCHAR signature_hash
        TIMESTAMPTZ signed_at
        BOOLEAN is_valid
        UUID invalidated_by FK
    }

    audit_trail {
        UUID id PK
        VARCHAR record_type
        UUID record_id
        VARCHAR action
        UUID changed_by FK
        TIMESTAMPTZ changed_at
        TEXT old_value
        TEXT new_value
        TEXT description
    }

    workflow_history {
        UUID id PK
        VARCHAR record_type
        UUID record_id
        VARCHAR process_key
        VARCHAR task_id
        VARCHAR task_key
        VARCHAR task_name
        UUID assignee_id FK
        UUID actor_id FK
        VARCHAR action
        VARCHAR old_status
        VARCHAR new_status
        TIMESTAMPTZ timestamp
        TEXT comment
    }

    attachments {
        UUID id PK
        VARCHAR record_type
        UUID record_id
        VARCHAR filename
        VARCHAR file_path
        BIGINT file_size
        UUID uploaded_by FK
        UUID parent_attachment_id FK "self-ref"
    }

    record_comments {
        UUID id PK
        VARCHAR record_type
        UUID record_id
        TEXT comment_text
        UUID created_by FK
    }

    notifications {
        UUID id PK
        VARCHAR notification_type
        UUID recipient_id FK
        VARCHAR subject
        TEXT message
        VARCHAR related_record_type
        UUID related_record_id
        BOOLEAN is_read
    }

    sequence_counters {
        UUID id PK
        VARCHAR sequence_name
        INTEGER year
        INTEGER current_value
        VARCHAR prefix
        VARCHAR format_pattern
        UUID plant_site_id FK
    }

    system_configurations {
        UUID id PK
        VARCHAR config_key UK
        TEXT config_value
        VARCHAR config_type
        BOOLEAN is_active
    }

    lookup_values {
        UUID id PK
        VARCHAR lookup_type
        VARCHAR lookup_code
        VARCHAR lookup_value
        INTEGER display_order
        BOOLEAN is_active
    }

    products {
        UUID id PK
        VARCHAR product_code UK
        VARCHAR product_name
        VARCHAR product_form "TABLET|CAPSULE|INJECTION|..."
        VARCHAR strength
        VARCHAR regulatory_classification "DRUG|NUTRACEUTICAL|COSMETIC"
        UUID manufacturer_id FK
        UUID plant_site_id FK
    }

    batches {
        UUID id PK
        VARCHAR batch_number
        UUID product_id FK
        DECIMAL batch_size
        DATE mfg_date
        DATE expiry_date
        BOOLEAN recalled
        VARCHAR stability_status "ONGOING|COMPLETED|FAILED"
    }

    regulatory_inspections {
        UUID id PK
        VARCHAR inspection_number UK
        TIMESTAMPTZ inspection_date
        VARCHAR regulatory_body
        VARCHAR inspection_type "ROUTINE|FOR_CAUSE|COURTESY|VOLUNTARY"
        VARCHAR outcome "ACCEPTABLE|ACCEPTABLE_WITH_COMMENTS|UNACCEPTABLE"
        UUID plant_site_id FK
    }

    regulatory_observations {
        UUID id PK
        UUID inspection_id FK
        VARCHAR observation_number
        TEXT description
        VARCHAR severity "CRITICAL|MAJOR|MINOR|INFORMATIONAL"
        VARCHAR response_status "PENDING|SUBMITTED|ACCEPTED|..."
    }

    regulatory_commitments {
        UUID id PK
        VARCHAR commitment_number UK
        TEXT commitment_description
        VARCHAR regulatory_body
        VARCHAR status "PENDING|IN_PROGRESS|COMPLETED|EXTENDED|CLOSED"
        UUID owner_id FK
        UUID plant_site_id FK
    }

    periodic_reviews {
        UUID id PK
        VARCHAR review_number UK
        UUID product_id FK
        VARCHAR review_period
        VARCHAR status "DRAFT|IN_PROGRESS|COMPLETED|APPROVED"
        UUID owner_id FK
        UUID plant_site_id FK
    }

    quality_metric_snapshots {
        UUID id PK
        VARCHAR metric_name
        DECIMAL metric_value
        UUID plant_site_id FK
        DATE snapshot_date
    }

    users ||--o{ electronic_signatures : "signs"
    users ||--o{ audit_trail : "changed_by"
    users ||--o{ notifications : "receives"
    users ||--o{ attachments : "uploads"
    users ||--o{ record_comments : "comments"
    products ||--o{ batches : "produced"
    regulatory_inspections ||--o{ regulatory_observations : "findings"
```

---

## 16. Complete Foreign Key Reference

### Cross-Domain Relationships

| Source Table | Column | References | Target Table | Relationship |
|---|---|---|---|---|
| `deviations` | `capa_id` | → | `capas.id` | Deviation triggers CAPA |
| `capas` | `deviation_id` | → | `deviations.id` | CAPA sourced from Deviation |
| `change_affected_documents` | `document_id` | → | `documents.id` | Change affects Document |
| `training_curricula` | `document_id` | → | `documents.id` | Curriculum uses Document |
| `document_distribution` | `recipient_id` | → | `users.id` | Document distributed to User |
| `training_session_attendees` | `assignment_id` | → | `training_assignments.id` | Session links to Assignment |
| `audit_findings` | `capa_id` | → | `capas.id` | Finding triggers CAPA |

### All Tables by Domain (70 tables)

| Domain | Tables | Count |
|---|---|---|
| **Core/Auth** | organizations, plant_sites, departments, users, security_profiles, application_roles, permissions, role_permissions, user_roles, user_security_profiles, security_profile_permissions, user_login_audit | 12 |
| **21 CFR Part 11** | electronic_signatures, audit_trail, workflow_history | 3 |
| **Deviation** | deviations, deviation_affected_batches, deviation_investigations, deviation_immediate_actions, deviation_impact_assessments, deviation_dispositions | 6 |
| **CAPA** | capas, capa_root_cause_analyses, capa_five_why_entries, capa_fishbone_categories, capa_risk_assessments, capa_actions, capa_effectiveness_checks | 7 |
| **Change Control** | change_requests, change_impact_assessments, change_regulatory_filings, change_affected_documents, change_affected_products, change_implementation_tasks, change_training_requirements, change_approvals, change_effectiveness_reviews, change_effectiveness_criteria | 10 |
| **Document** | documents, document_versions, document_reviews, document_approvals, document_distribution, document_references | 6 |
| **Training** | training_curricula, training_assignments, training_matrix, training_sessions, training_session_attendees | 5 |
| **Risk** | risk_registers, risk_assessments, risk_controls, risk_reviews | 4 |
| **Audit** | audit_plans, audits, audit_team_members, audit_checklists, audit_checklist_items, audit_findings | 6 |
| **Supplier** | suppliers, supplier_qualifications, supplier_scorecards, supplier_materials | 4 |
| **Complaint** | complaints, complaint_samples, complaint_trending | 3 |
| **Nonconformance** | nonconformances | 1 |
| **Equipment** | equipment, calibration_records, maintenance_records | 3 |
| **Validation** | validation_projects, validation_requirements, validation_test_protocols, validation_test_cases, validation_traceability | 5 |
| **Management Review** | management_reviews, management_review_attendees, management_review_metrics, management_review_actions | 4 |
| **Regulatory** | regulatory_inspections, regulatory_observations, regulatory_commitments | 3 |
| **System/Shared** | attachments, record_comments, notifications, sequence_counters, system_configurations, lookup_values, products, batches, periodic_reviews, quality_metric_snapshots | 10 |

### Shared Pattern: `users` FK References

Nearly every domain table references `users` for ownership, assignment, and audit fields:

| Pattern | Columns | Used In |
|---|---|---|
| **Ownership** | `owner_id`, `initiator_id` | capas, deviations, change_requests, documents, risk_registers, audits, suppliers, complaints |
| **Assignment** | `assigned_to_id`, `lead_auditor_id`, `investigator_id` | deviations, capa_actions, audits, training_assignments |
| **Review/Approval** | `reviewer_id`, `approver_id`, `approved_by_id`, `assessed_by_id` | deviations, documents, change_approvals, capa_risk_assessments |
| **Audit Fields** | `created_by`, `updated_by` | All main record tables |

### Shared Pattern: `plant_sites` and `departments`

All major record tables include `plant_site_id` (FK to `plant_sites`) and most include `department_id` (FK to `departments`) for organizational scoping.

### Flowable Workflow Fields

Tables with BPMN workflow integration:

| Table | Fields |
|---|---|
| `deviations` | `flowable_process_id`, `current_workflow_step` |
| `capas` | `flowable_process_id`, `current_workflow_step` |
| `change_requests` | `flowable_process_id`, `current_workflow_step` |
| `documents` | `flowable_process_id`, `current_workflow_step` |
| `training_assignments` | `flowable_process_id` |
| `risk_registers` | `flowable_process_id`, `current_workflow_step` |
| `audits` | `flowable_process_id`, `current_workflow_step` |
| `suppliers` | `flowable_process_id`, `current_workflow_step` |
| `complaints` | `flowable_process_id`, `current_workflow_step` |
| `nonconformances` | `flowable_process_id`, `current_workflow_step` |
| `equipment` | `flowable_process_id` |
