# Document Management - Complete Workflow Guide

## Table of Contents
1. [Overview](#1-overview)
2. [Roles & Permissions](#2-roles--permissions)
3. [Document Statuses & Enums](#3-document-statuses--enums)
4. [Database Tables (DDL)](#4-database-tables-ddl)
5. [Flowable BPMN Process](#5-flowable-bpmn-process)
6. [Backend API Endpoints](#6-backend-api-endpoints)
7. [Complete Workflow - Step by Step](#7-complete-workflow---step-by-step)
8. [Notifications](#8-notifications)
9. [Cross-Module Integration](#9-cross-module-integration)
10. [Frontend UI Components](#10-frontend-ui-components)
11. [Audit Trail](#11-audit-trail)
12. [Periodic Review & Document Lifecycle](#12-periodic-review--document-lifecycle)

---

## 1. Overview

The Document Management module (Document Control) manages the full lifecycle of regulated pharmaceutical documents - SOPs, Work Instructions, Batch Records, Protocols, Policies, and more. It ensures documents go through proper authoring, review, approval, training, and periodic review cycles per GMP requirements.

**Process ID:** `documentProcess`
**Record Type:** `DOCUMENT`
**Number Format:** `DOC-YYYY-NNN` (e.g., DOC-2026-001)
**Migration File:** `V4__document_training_schema.sql`

### Key Features
- Version-controlled document management with major/minor versioning
- Multi-reviewer draft review with revision loop
- QA approval with e-signature support
- Training assignment integration on document approval
- Periodic review scheduling (configurable, default 24 months)
- Document distribution tracking with acknowledgment
- Cross-references between documents (SUPERSEDES, REFERENCES, etc.)
- Confidentiality levels (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED)
- Integration with Change Control (affected documents) and CAPA/Deviation workflows
- Dashboard with KPIs: overdue reviews, expiring documents, status distribution

---

## 2. Roles & Permissions

| Role Code | Role Name | Key Responsibilities |
|-----------|-----------|---------------------|
| `END_USER` | Document Author | Create drafts, upload files, revise per reviewer feedback |
| `DOC_REVIEWER` | Document Reviewer | Review drafts for technical accuracy, request revisions |
| `QA_REVIEWER` | QA Reviewer | Review drafts for compliance, assign training |
| `QA_APPROVER` | QA Approver | Approve documents for release (with e-signature) |
| `TRAINING_COORDINATOR` | Training Coordinator | Assign training on new/revised documents |
| `VAULT_ADMIN` | System Administrator | Full access to all document actions |

### UI Workflow Actions (from `doc-detail.component.ts`)

| Document Status | Action | Button Visibility |
|----------------|--------|-------------------|
| DRAFT | Submit for Review | Visible when status = DRAFT |
| PENDING_APPROVAL | Approve | Visible when status = PENDING_APPROVAL |
| EFFECTIVE | Create New Version | Visible when status = EFFECTIVE |
| EFFECTIVE | Obsolete | Visible when status = EFFECTIVE |

### Permission Module

| Module | Action | Resource |
|--------|--------|----------|
| DOCUMENT | READ | document |
| DOCUMENT | CREATE | document |
| DOCUMENT | UPDATE | document |

---

## 3. Document Statuses & Enums

### Document Status Lifecycle

```
DRAFT -> PENDING_REVIEW -> UNDER_REVIEW -> PENDING_APPROVAL -> APPROVED -> EFFECTIVE
                ^                |                |                              |
                |                v                v                              v
                +--------REVISION_REQUIRED   REJECTED                     SUPERSEDED
                |        (back to author)    (back to author)                    |
                +------------------------------------------------------------->OBSOLETE
                                                                                |
                                                                            ARCHIVED
```

### DocumentStatus

| Status | Description |
|--------|-------------|
| `DRAFT` | Document being authored, not yet submitted |
| `PENDING_REVIEW` | Submitted for review, awaiting reviewer pickup |
| `UNDER_REVIEW` | Reviewer actively reviewing the document |
| `PENDING_APPROVAL` | Review passed, awaiting QA approval |
| `APPROVED` | QA approved, pending training and effective date |
| `EFFECTIVE` | Document is live and in active use |
| `SUPERSEDED` | Replaced by a newer version |
| `OBSOLETE` | No longer valid, retired |
| `ARCHIVED` | Preserved for historical reference |

### DocumentType

`SOP`, `WORK_INSTRUCTION`, `BATCH_RECORD`, `PROTOCOL`, `REPORT`, `POLICY`, `FORM`, `SPECIFICATION`, `VALIDATION_PROTOCOL`, `STANDARD`, `GUIDELINE`, `MANUAL`

### DocumentVersionStatus

`DRAFT`, `UNDER_REVIEW`, `APPROVED`, `EFFECTIVE`, `SUPERSEDED`, `REJECTED`

### DocumentChangeType

`NEW`, `MINOR_REVISION`, `MAJOR_REVISION`, `PERIODIC_REVIEW`, `CORRECTION`

### ConfidentialityLevel

`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`

### DocumentReferenceType

`REFERENCES`, `SUPERSEDES`, `SUPPLEMENTS`, `RELATED_TO`, `PARENT_OF`, `CHILD_OF`

### DocumentAction (used in Change Control affected documents)

`REVISE`, `RETIRE`, `CREATE_NEW`, `NO_CHANGE`

### ReviewDecision (for periodic reviews)

`NO_CHANGE_REQUIRED`, `REVISION_REQUIRED`, `OBSOLETE`, `EXTEND_REVIEW`

### ReviewType

`PERIODIC`, `TRIGGERED`, `INITIAL`

### ReviewStatus

`PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`

---

## 4. Database Tables (DDL)

**Migration:** `V4__document_training_schema.sql`

### 4.1 Main Table: `documents`

```sql
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
```

### 4.2 `document_versions`

```sql
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
```

### 4.3 `document_reviews`

```sql
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
```

### 4.4 `document_approvals`

```sql
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
```

### 4.5 `document_distribution`

```sql
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
```

### 4.6 `document_references`

```sql
CREATE TABLE document_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_document_id UUID NOT NULL REFERENCES documents(id),
    target_document_id UUID NOT NULL REFERENCES documents(id),
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN (
        'REFERENCES', 'SUPERSEDES', 'SUPPLEMENTS', 'RELATED_TO', 'PARENT_OF', 'CHILD_OF')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_document_id, target_document_id, reference_type)
);
```

### Database Indexes

```sql
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
```

### Sequence Counter

```sql
INSERT INTO sequence_counters (sequence_name, year, current_value, prefix, format_pattern)
VALUES ('DOCUMENT', EXTRACT(YEAR FROM NOW())::INTEGER, 0, 'DOC', '{PREFIX}-{YEAR}-{SEQ:3}');
```

---

## 5. Flowable BPMN Process

**Process Definition:** `document-process.bpmn20.xml`
**Process ID:** `documentProcess`

### Process Elements

| Element | Type | ID | Assignment | Description |
|---------|------|-----|-----------|-------------|
| Start Event | startEvent | `start` | - | Document Drafted |
| Draft Review | userTask | `draftReview` | candidateGroups: `DOC_REVIEWER,QA_REVIEWER` | Review document for accuracy and compliance |
| Review Gateway | exclusiveGateway | `reviewGateway` | - | Routes on `${reviewDecision}` |
| Author Revision | userTask | `authorRevision` | assignee: `${authorId}` | Author revises based on feedback |
| QA Approval | userTask | `qaApproval` | candidateGroups: `QA_APPROVER` | QA Head approves for release |
| Approval Gateway | exclusiveGateway | `approvalGateway` | - | Routes on `${approvalDecision}` |
| Training Assignment | userTask | `training` | candidateGroups: `TRAINING_COORDINATOR,QA_REVIEWER` | Assign training to affected personnel |
| Make Effective | serviceTask | `makeEffective` | documentEffectiveDelegate | Sets effective date, calculates next review |
| Notify Effective | serviceTask | `notifyEffective` | notificationDelegate | Sends STATUS_CHANGE to authorId |
| End Event | endEvent | `end` | - | Document Effective |
| Periodic Review Timer | boundaryEvent | `periodicReviewTimer` | - | P365D (1 year) non-interrupting |
| Periodic Review Reminder | serviceTask | `periodicReviewReminder` | notificationDelegate | Sends PERIODIC_REVIEW_DUE to authorId |

### Process Variables

| Variable | Type | Set By | Used By |
|----------|------|--------|---------|
| `recordId` | UUID | create() | All tasks |
| `documentNumber` | String | create() | Notifications |
| `documentType` | String | create() | Reference |
| `authorId` | UUID | create() | authorRevision assignee, notifications |
| `reviewerId` | UUID | review | Reference |
| `approverId` | UUID | approval | Reference |
| `effectiveDate` | Date | makeEffective | Reference |
| `version` | String | create() | Notifications |
| `departmentId` | UUID | create() | Reference |
| `reviewDecision` | String | draftReview | reviewGateway condition |
| `approvalDecision` | String | qaApproval | approvalGateway condition |

### Flow Sequence

```
start -> draftReview -> reviewGateway
    -> [APPROVED] -> qaApproval -> approvalGateway
        -> [APPROVED] -> training -> makeEffective -> notifyEffective -> end
        -> [REJECTED] -> authorRevision -> draftReview (loop)
    -> [REVISION_REQUIRED] -> authorRevision -> draftReview (loop)

makeEffective --[P365D timer]--> periodicReviewReminder -> reminderEnd
```

### Key Design: Revision Loop

The BPMN process includes a **revision loop** — when a reviewer requests changes (REVISION_REQUIRED) or QA rejects (REJECTED), the process routes back to `authorRevision` (assigned to the original author), then back to `draftReview`. This loop continues until the document passes review and approval.

---

## 6. Backend API Endpoints

**Base URL:** `/api/v1/documents`
**Controller:** `DocumentController.java`
**Service:** `DocumentService.java`

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | `/api/v1/documents` | List documents with filters (status, documentType, category, search) |
| 2 | GET | `/api/v1/documents/{id}` | Get document by ID (includes versions, reviews) |
| 3 | POST | `/api/v1/documents` | Create new document (DRAFT) |
| 4 | PUT | `/api/v1/documents/{id}` | Update document metadata |
| 5 | PATCH | `/api/v1/documents/{id}/status` | Transition document status |
| 6 | GET | `/api/v1/documents/dashboard` | Get dashboard metrics |

### Dashboard Metrics Response

```json
{
  "totalDocuments": 48,
  "effectiveDocuments": 32,
  "draftDocuments": 5,
  "pendingReview": 4,
  "pendingApproval": 3,
  "overdueReviews": 2,
  "expiringNext30Days": 3,
  "byType": [{"type": "SOP", "count": 22}, ...],
  "byStatus": [{"status": "EFFECTIVE", "count": 32}, ...]
}
```

### Custom Repository Queries

```java
long countByStatus(DocumentStatus status);
long countOverdueReviews(Instant now);           // nextReviewDate < now AND status = EFFECTIVE
long countExpiringWithin(Instant now, Instant threshold);  // nextReviewDate BETWEEN now AND threshold
List<Object[]> countByType();                    // GROUP BY documentType
List<Object[]> countByStatus();                  // GROUP BY status
Page<Document> findByOwnerId(UUID ownerId, Pageable pageable);
```

---

## 7. Complete Workflow - Step by Step

### Step 1: Create Document (Status: DRAFT)

**Who:** Document Author (any authenticated user with DOCUMENT.CREATE permission)
**UI:** Doc Form Component (`doc-form.component.ts`)

**Form Fields (3 sections):**

*Document Information:*
- Title (required)
- Description (text)
- Document Type: SOP, WORK_INSTRUCTION, BATCH_RECORD, etc. (required)
- Category: Production, Quality Control, Quality Assurance, etc. (required)
- Sub-Category (optional)
- Confidentiality Level: PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED (default: INTERNAL)

*Location & Ownership:*
- Plant Site (required)
- Department (required)

*Review & Compliance:*
- Review Period in months (default: 24)
- Regulatory Reference (e.g., "Schedule M Sec 14.3, 21 CFR 211.186")
- Keywords (comma-separated, for search)

*File Upload:*
- Drag-and-drop or click-to-upload
- Supported: PDF, DOCX, XLSX (max 50MB)
- File uploaded as attachment via `POST /api/v1/attachments`

**Backend (`DocumentService.create()`):**
1. Generate document number: `DOC-YYYY-NNN`
2. INSERT into `documents` table with status = DRAFT
3. Set owner to current authenticated user
4. Set currentWorkflowStep = "Draft"
5. Record audit trail: CREATED
6. Return 201 Created

**User actions after creation:**
- "Save as Draft" - saves and navigates to detail page
- "Submit for Review" - saves and transitions to PENDING_REVIEW

---

### Step 2: Submit for Review (Status: DRAFT -> PENDING_REVIEW)

**Who:** Document Author
**UI Action:** "Submit for Review" button on detail page or form

**Backend (`DocumentService.transitionStatus()`):**
1. Validate current status is DRAFT
2. Change status to PENDING_REVIEW
3. Set currentWorkflowStep to "PENDING REVIEW"
4. Start Flowable process (if not already started): `documentProcess` with variables
5. Flowable creates `draftReview` user task (candidateGroups: DOC_REVIEWER, QA_REVIEWER)
6. Record audit trail: STATUS_CHANGED (DRAFT -> PENDING_REVIEW)

---

### Step 3: Draft Review (Status: UNDER_REVIEW)

**Who:** Document Reviewer (DOC_REVIEWER) or QA Reviewer (QA_REVIEWER)

**How the Reviewer sees it:**
1. Reviewer sees `draftReview` task in Task Inbox
2. Claims the task (candidate group task requires claiming)
3. Reviews document content, checks technical accuracy and regulatory compliance
4. Downloads and reads attached document file

**Review Outcomes:**
- **APPROVED** - Document passes review, moves to QA Approval
- **REVISION_REQUIRED** - Reviewer requests changes, document goes back to author

**Backend (completing `draftReview` task):**
1. Complete Flowable `draftReview` task with variable: `reviewDecision = 'APPROVED'` or `'REVISION_REQUIRED'`
2. Flowable hits `reviewGateway`:
   - If `APPROVED` -> creates `qaApproval` task (candidateGroups: QA_APPROVER)
   - If `REVISION_REQUIRED` -> creates `authorRevision` task (assignee: authorId)
3. Update document status accordingly
4. Record workflow step and audit trail

---

### Step 3a: Author Revision (Revision Loop)

**Who:** Original Document Author (assigned by `${authorId}`)

**When:** Reviewer requested revisions OR QA Approver rejected

**Process:**
1. Author receives notification of required revisions
2. `authorRevision` Flowable task is assigned directly to the author
3. Author revises document, uploads new version
4. Upon completion, process loops back to `draftReview`
5. The cycle repeats until document passes review

This revision loop is a key compliance feature - it ensures all reviewer feedback is addressed before a document can proceed to approval.

---

### Step 4: QA Approval (Status: PENDING_APPROVAL -> APPROVED)

**Who:** QA Approver (QA_APPROVER role)

**How they see it:**
1. QA Approver sees `qaApproval` task in Task Inbox
2. Claims the task
3. Reviews document for regulatory compliance, GMP adequacy
4. E-signature captured for approval (21 CFR Part 11)

**Approval Outcomes:**
- **APPROVED** - Document approved, proceeds to training assignment
- **REJECTED** - Document rejected, goes back to author for revision

**Backend (completing `qaApproval` task):**
1. Complete Flowable `qaApproval` task with `approvalDecision = 'APPROVED'` or `'REJECTED'`
2. Flowable hits `approvalGateway`:
   - If `APPROVED` -> creates `training` task (candidateGroups: TRAINING_COORDINATOR, QA_REVIEWER)
   - If `REJECTED` -> creates `authorRevision` task (back to author, revision loop)
3. If approved:
   - INSERT into `document_approvals` with decision, comments, electronic_signature_id
   - Update document status to APPROVED
4. Record audit trail: APPROVED or REJECTED

---

### Step 5: Training Assignment (Status: APPROVED -> EFFECTIVE)

**Who:** Training Coordinator (TRAINING_COORDINATOR) or QA Reviewer (QA_REVIEWER)

**Process:**
1. Coordinator receives `training` task
2. Identifies personnel who need training on the new/revised document
3. Creates training assignments linked to the document
4. INSERT into `document_distribution` for each recipient:
   - `training_required = true` if the recipient needs formal training
   - `acknowledged = false` (pending acknowledgment)
5. Training assignments also go into `training_assignments` table (from training module):
   - `assignment_reason` = 'SOP_REVISION' or 'NEW_HIRE'
   - Links to `document_id` via `training_curricula`
6. Complete Flowable `training` task

---

### Step 6: Make Effective (Automatic)

**Who:** System (Flowable service task)
**Task:** `makeEffective` (delegateExpression: `${documentEffectiveDelegate}`)

**Process (automatic, no user interaction):**
1. `documentEffectiveDelegate` executes:
   - Sets `effectiveDate = now()`
   - Calculates `nextReviewDate = now() + reviewPeriodMonths * 30 days`
   - Updates document status to EFFECTIVE
   - Marks current version as EFFECTIVE
   - If replacing a previous version, marks old version as SUPERSEDED
2. Flowable proceeds to `notifyEffective` service task
3. Notification sent to author: "Document Effective: {documentNumber} v{version}"
4. Process reaches end event

---

### Step 7: Periodic Review (Ongoing)

**Trigger:** P365D boundary timer on `makeEffective` (non-interrupting, fires after 1 year)

**Process:**
1. Timer fires after 365 days
2. `periodicReviewReminder` service task sends notification:
   - Type: PERIODIC_REVIEW_DUE
   - Title: "Periodic Review Due: {documentNumber}"
   - Recipient: authorId
3. Document owner initiates periodic review
4. Creates `document_reviews` record with reviewType = PERIODIC
5. Review outcomes:
   - **NO_CHANGE_REQUIRED** - Document remains effective, next review date updated
   - **REVISION_REQUIRED** - Triggers a new revision cycle
   - **OBSOLETE** - Document marked as OBSOLETE
   - **EXTEND_REVIEW** - Review period extended

---

## 8. Notifications

| Trigger | Type | Recipient | Title Template | When |
|---------|------|-----------|---------------|------|
| Document Effective | `STATUS_CHANGE` | authorId | "Document Effective: {documentNumber}" | After make effective step |
| Periodic Review Due | `PERIODIC_REVIEW_DUE` | authorId | "Periodic Review Due: {documentNumber}" | After 365 days (P365D timer) |
| Training Assigned | `TASK_ASSIGNED` | assigned trainee | "Training Assigned: {documentNumber}" | After training step |
| Review Required | `TASK_ASSIGNED` | reviewer | "Document Review: {documentNumber}" | When draft submitted |
| Approval Required | `TASK_ASSIGNED` | approver | "Approval Required: {documentNumber}" | When review approved |

---

## 9. Cross-Module Integration

### 9.1 Change Control -> Document Management

The Change Control module tracks **affected documents** that need to be revised as part of a change request.

**Table:** `change_affected_documents`

```sql
CREATE TABLE change_affected_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id UUID NOT NULL REFERENCES change_requests(id),
    document_number VARCHAR(100) NOT NULL,
    document_title VARCHAR(500) NOT NULL,
    document_type VARCHAR(100),
    current_version VARCHAR(50),
    action VARCHAR(20) NOT NULL CHECK (action IN ('REVISE', 'RETIRE', 'CREATE_NEW', 'NO_CHANGE')),
    new_version VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED'))
);
```

**Entity:** `ChangeAffectedDocument.java`
- Links a Change Request to documents that need action
- Actions: REVISE (create new version), RETIRE (make obsolete), CREATE_NEW (new document), NO_CHANGE
- Status tracks completion: PENDING -> IN_PROGRESS -> COMPLETED

**Flow:**
1. During Change Control Impact Assessment, Change Owner identifies affected documents
2. POST `/api/v1/change-requests/{id}/affected-documents` creates entries
3. During Implementation phase, documents are revised via the Document Management module
4. Status updated to COMPLETED when document revision is approved

### 9.2 CAPA -> Document Management

CAPA actions may require document revisions:
- Corrective/Preventive actions often result in SOP revisions
- CAPA implementation tasks reference specific document numbers
- Training on revised documents is tracked through the training module

### 9.3 Deviation -> Document Management

Deviations may trigger document reviews:
- Root cause analysis may identify SOP gaps
- Disposition may require document updates
- CAPA initiated from deviation may include document revisions

### 9.4 Training Module Integration

When a document becomes effective:
- Training curricula can be linked to documents (`training_curricula.document_id`)
- Training assignments created with reason `SOP_REVISION`
- Distribution tracking ensures all personnel acknowledge the new document
- Training completion status tracked in `document_distribution.training_completed`

### 9.5 Task Inbox

The Task Inbox service (`TaskInboxService`) maps process definitions to record types. Currently the `documentProcess` mapping is not yet wired in the task inbox (unlike deviationProcess, capaProcess, and changeControlProcess which are mapped). Document workflow tasks appear in Flowable but need to be integrated into the unified task inbox for seamless user experience.

---

## 10. Frontend UI Components

### 10.1 Document Dashboard (`doc-dashboard.component.ts`)

- **Route:** `/documents/dashboard`
- **KPI Strip (6 metrics):**
  - Total Documents
  - Effective (green)
  - Pending Review (orange)
  - Pending Approval (purple)
  - Overdue Reviews (red)
  - Expiring in 30 days
- **4 Panels:**
  - Documents by Type (horizontal bar chart)
  - Recent Documents (clickable list with status badges)
  - Upcoming Reviews (sorted by due date, overdue highlighted)
  - Quick Actions: New Document, Search, Pending Reviews, My Drafts

### 10.2 Document List (`doc-list.component.ts`)

- **Route:** `/documents/list`
- **Filters:** Search, Status (multi-select), Type (multi-select), Category (select)
- **Table Columns:** Doc Number, Title, Type, Status, Version, Owner, Effective Date, Next Review
- **Features:**
  - Clickable rows navigate to detail
  - Overdue review dates highlighted in red
  - Create button gated by DOCUMENT.CREATE permission
  - Status badges with color coding

### 10.3 Document Form (`doc-form.component.ts`)

- **Route:** `/documents/create`
- **3 Form Sections:**
  1. Document Information (title, description, type, category, sub-category, confidentiality)
  2. Location & Ownership (plant site, department)
  3. Review & Compliance (review period, regulatory reference, keywords)
- **File Upload:** Drag-and-drop area for document files (PDF, DOCX, XLSX)
- **Actions:**
  - "Save as Draft" - creates document and navigates to detail
  - "Submit for Review" - creates and submits in one action
- Uses `DocumentService.createDocument()` followed by `uploadAttachment()` if file selected

### 10.4 Document Detail (`doc-detail.component.ts`)

- **Route:** `/documents/detail/:id`
- **Header:** Document number, title, status badge, version badge, action buttons
- **Tab-based Layout:**

| Tab | Content |
|-----|---------|
| Overview | Document details (type, category, confidentiality, regulatory ref, keywords), Ownership (owner, department, plant site), Dates (effective, next review, review period, created, updated), Description |
| Version History | Table of all versions with: version number, change type, description, status, author, file download link, date |
| Reviews | Table of periodic reviews: type, due date, reviewer, decision, status, completed date |
| Distribution | Table: recipient, department, distribution date, acknowledged (checkmark), training required, training completed |
| Audit Trail | Table: timestamp, user, action, field, old value, new value, comments |

**Workflow Action Buttons (conditional):**
- DRAFT: "Submit for Review"
- PENDING_APPROVAL: "Approve"
- EFFECTIVE: "Create New Version", "Obsolete"

### 10.5 Document Service (`document.service.ts`)

**API methods:**
- `getDocuments(filter?)` - List with filtering
- `getDocumentById(id)` - Get with versions and reviews
- `createDocument(doc)` - POST to create
- `uploadAttachment(file, recordType, recordId, category, description)` - File upload
- `getDashboardMetrics()` - Dashboard KPIs
- `submitForReview(id)` - PATCH status to PENDING_REVIEW
- `approveDocument(id, comments?)` - PATCH status to APPROVED

### 10.6 Routes (`document.routes.ts`)

| Path | Component | Permission |
|------|-----------|------------|
| `/documents/dashboard` | DocDashboardComponent | DOCUMENT.READ |
| `/documents/list` | DocListComponent | DOCUMENT.READ |
| `/documents/create` | DocFormComponent | DOCUMENT.CREATE |
| `/documents/detail/:id` | DocDetailComponent | DOCUMENT.READ |

---

## 11. Audit Trail

Every document action is recorded in the shared `audit_trail` table:

| Action | When | Details |
|--------|------|---------|
| CREATED | Document first created | Initial document metadata |
| UPDATED | Document metadata updated | Field changes |
| STATUS_CHANGED | Any status transition | status: oldValue -> newValue |
| VERSION_CREATED | New version uploaded | Version number, change type |
| REVIEW_SUBMITTED | Periodic review completed | Review decision |
| APPROVED | QA approval granted | Approver, e-signature reference |
| DISTRIBUTED | Document distributed | Recipient list |
| TRAINING_ASSIGNED | Training created for document | Assignee, due date |

---

## 12. Periodic Review & Document Lifecycle

### Review Scheduling

- Default review period: 24 months (configurable per document)
- `nextReviewDate` calculated as: `effectiveDate + reviewPeriodMonths * 30 days`
- P365D Flowable timer sends reminder after 1 year
- Dashboard tracks overdue reviews and documents expiring within 30 days

### Version Management

When creating a new version of an existing EFFECTIVE document:
1. Current effective version is marked SUPERSEDED with `supersededDate`
2. New version created with incremented version number
3. New version goes through the full review/approval cycle
4. Upon approval, new version becomes EFFECTIVE
5. Document's `currentVersion` and `currentVersionId` updated

### Document Retirement

To make a document OBSOLETE:
1. User initiates obsolete action
2. Status transitions: EFFECTIVE -> OBSOLETE
3. All distribution recipients notified
4. Document remains in system for historical reference
5. Can later be moved to ARCHIVED status

### Regulatory Compliance

- All document changes tracked with full audit trail
- Electronic signatures stored in `electronic_signatures` table (linked from `document_approvals`)
- Content hash (`content_hash` in document_versions) ensures document integrity
- Version history provides complete change lineage per 21 CFR Part 11
- Periodic review ensures documents remain current per GMP requirements
