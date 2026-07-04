# Change Control Workflow - Complete Guide

> Comprehensive documentation of the Change Control management workflow in the QMS-Pharma platform, covering backend services, UI components, Flowable BPMN engine, database schema, notifications, roles, and the complete lifecycle.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Statuses & Lifecycle](#2-statuses--lifecycle)
3. [Roles & Permissions](#3-roles--permissions)
4. [Flowable BPMN Workflow Engine](#4-flowable-bpmn-workflow-engine)
5. [Step-by-Step Walkthrough](#5-step-by-step-walkthrough)
6. [Backend API Reference](#6-backend-api-reference)
7. [Frontend UI Components](#7-frontend-ui-components)
8. [Database Schema](#8-database-schema)
9. [Notifications](#9-notifications)
10. [Task Inbox](#10-task-inbox)
11. [Audit Trail](#11-audit-trail)
12. [Complete End-to-End Scenario](#12-complete-end-to-end-scenario)

---

## 1. Overview

Change Control is a regulated pharma quality process that manages any proposed change to validated processes, equipment, facilities, documents, systems, materials, suppliers, regulatory filings, packaging, or analytical methods. Every change must be assessed for impact, reviewed by QA (and optionally RA), approved by authorized signatories, implemented with tracked tasks, verified, and checked for effectiveness before closure.

### Key Characteristics

- **Multi-step workflow** with 13 possible statuses
- **Impact assessment** across 8 dimensions (product quality, patient safety, regulatory, validation, documentation, training, supplier, stability)
- **Conditional RA review** path when regulatory filing is required
- **Multi-approver** support with sequential approval order
- **Implementation task tracking** with progress monitoring
- **Training requirement** management
- **Effectiveness review** with criteria-based evaluation
- **Electronic signature** (21 CFR Part 11) for approvals, verification, and closure
- **Full audit trail** with field-level change tracking
- **Flowable BPMN** engine for process orchestration with escalation timers

### Architecture

```
Angular Change Control MFE (cc-form, cc-detail, cc-list, cc-dashboard)
    |
    v
Spring Boot REST API (ChangeRequestController)
    |
    v
ChangeRequestService  <-->  WorkflowService (Flowable TaskService/RuntimeService)
    |                            |
    v                            v
PostgreSQL                  Flowable Engine (change-control-process.bpmn20.xml)
    |
    +-- change_requests (main table)
    +-- change_impact_assessments
    +-- change_regulatory_filings
    +-- change_affected_documents
    +-- change_affected_products
    +-- change_implementation_tasks
    +-- change_training_requirements
    +-- change_approvals
    +-- change_effectiveness_reviews
    +-- change_effectiveness_criteria
    +-- workflow_history (dual tracking)
    +-- audit_trail
    +-- notifications
```

---

## 2. Statuses & Lifecycle

### Status Enum (`ChangeStatus.java`)

| Status | Description |
|--------|-------------|
| `DRAFT` | Initial state when change request is created |
| `SUBMITTED` | Change request submitted for processing |
| `IMPACT_ASSESSMENT` | Impact assessment being conducted (UI-only status) |
| `QA_REVIEW` | Quality Assurance reviewing the change and impact |
| `RA_REVIEW` | Regulatory Affairs reviewing (only if regulatory filing required) |
| `PENDING_APPROVAL` | Awaiting approval from designated approvers |
| `APPROVED` | All approvals obtained, ready for implementation |
| `IMPLEMENTATION` | Implementation tasks being executed |
| `VERIFICATION` | QA verifying implementation completeness |
| `EFFECTIVENESS_CHECK` | Evaluating change effectiveness against criteria |
| `CLOSED` | Change control fully closed |
| `REJECTED` | Change request rejected at any review/approval stage |
| `WITHDRAWN` | Change request withdrawn by originator |

### Status Flow Diagram

```
DRAFT
  |
  v
SUBMITTED
  |
  v
IMPACT_ASSESSMENT (UI)
  |
  v
QA_REVIEW
  |
  +--[regulatoryFilingRequired=true]--> RA_REVIEW --> PENDING_APPROVAL
  |                                                        |
  +--[regulatoryFilingRequired=false]---> PENDING_APPROVAL  |
                                              |             |
                                              +<------------+
                                              |
                                  +-----------+-----------+
                                  |                       |
                          [APPROVED]               [REJECTED] --> END
                                  |
                                  v
                          IMPLEMENTATION
                                  |
                                  v
                          VERIFICATION
                                  |
                                  v
                      EFFECTIVENESS_CHECK
                                  |
                          +-------+-------+
                          |               |
                       CLOSED     IMPLEMENTATION (reopen)
```

### Closure Validation Rules

Before closing, the system validates:
1. **All implementation tasks completed** - No incomplete tasks allowed
2. **All approvals obtained** - No pending approvals
3. **All training completed** (if training required) - No incomplete training requirements

---

## 3. Roles & Permissions

### Roles Involved in Change Control

| Role Code | Role Name | Responsibilities |
|-----------|-----------|-----------------|
| `END_USER` | End User | Create change requests, view records |
| `OWNER` | Change Owner | Fill details, submit, manage impact assessment, execute implementation tasks |
| `QA_REVIEWER` | QA Reviewer | Review change request and impact, RA review (if applicable), verify implementation |
| `QA_APPROVER` | QA Approver | Approve/reject changes, verify implementation, conduct effectiveness check, close |
| `APPROVER` | Approver | Approve/reject changes (general approver role) |
| `REVIEWER` | Reviewer | RA review participation |
| `VAULT_ADMIN` | System Admin | Full access to all workflow actions |

### Permission Matrix by Status

| Status | Who Can Act | Available Actions |
|--------|-------------|-------------------|
| DRAFT | OWNER, END_USER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN | Submit Change Request |
| SUBMITTED | OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN | Start Impact Assessment |
| SUBMITTED | QA_REVIEWER, QA_APPROVER, VAULT_ADMIN | Reject |
| IMPACT_ASSESSMENT | OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN | Submit for QA Review |
| QA_REVIEW | QA_REVIEWER, QA_APPROVER, VAULT_ADMIN | Approve QA Review (routes to RA or Approval), Reject |
| RA_REVIEW | REVIEWER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN | Approve RA Review, Reject |
| PENDING_APPROVAL | QA_APPROVER, APPROVER, VAULT_ADMIN | Approve Change (e-sign), Reject |
| APPROVED | OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN | Start Implementation |
| IMPLEMENTATION | OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN | Complete Implementation |
| VERIFICATION | QA_REVIEWER, QA_APPROVER, VAULT_ADMIN | Verify & Start Effectiveness (e-sign) |
| EFFECTIVENESS_CHECK | QA_APPROVER, VAULT_ADMIN | Close Change Request (e-sign), Reopen Implementation |

### Database Permission Profiles (from V3__test_data.sql)

- **END_USER**: CREATE, READ, UPDATE for CHANGE_CONTROL
- **Change Owner Profile**: All CHANGE_CONTROL permissions
- **Document Control Profile**: READ all + CREATE/UPDATE CHANGE_CONTROL
- **QA_REVIEWER**: READ access to CHANGE_CONTROL (+ review workflow actions)
- **QA_APPROVER**: Full access through workflow candidate groups

---

## 4. Flowable BPMN Workflow Engine

### Process Definition

- **File**: `backend/src/main/resources/processes/change-control-process.bpmn20.xml`
- **Process ID**: `changeControlProcess`
- **Process Name**: Change Control Management Process

### Process Variables (set at start)

| Variable | Source | Description |
|----------|--------|-------------|
| `recordId` | `cr.getId()` | Change request UUID |
| `changeNumber` | `cr.getChangeNumber()` | e.g., "CC-2026-001" |
| `requestedById` | `currentUser.getId()` | Who created the request |
| `changeOwnerId` | `cr.getChangeOwner().getId()` | Assigned change owner |
| `classification` | `cr.getClassification()` | MINOR / MAJOR / CRITICAL |
| `regulatoryFilingRequired` | `cr.getRegulatoryFilingRequired()` | Routes to RA review if true |
| `trainingRequired` | `cr.getTrainingRequired()` | Training tracking flag |
| `plantSiteId` | `cr.getPlantSite().getId()` | Plant site UUID |
| `departmentId` | `cr.getDepartment().getId()` | Department UUID |
| `targetImplementationDate` | `cr.getTargetImplementationDate()` | Due date for implementation task |

### BPMN Tasks

| Task ID | Task Name | Type | Assignee / Candidate | Form Key |
|---------|-----------|------|---------------------|----------|
| `submitChange` | Complete & Submit Change Request | User Task | `${changeOwnerId}` | `cc-submit` |
| `impactAssessment` | Impact Assessment | User Task | `${changeOwnerId}` | `cc-impact` |
| `qaReview` | QA Review | User Task | `${qaReviewerId}` | `cc-qa-review` |
| `raReview` | Regulatory Affairs Review | User Task | Candidate: `QA_REVIEWER` | `cc-ra-review` |
| `pendingApproval` | Pending Approval | User Task | Candidate: `QA_APPROVER,APPROVER` | `cc-approval` |
| `implementation` | Implementation | User Task | `${changeOwnerId}` | `cc-implement` |
| `verification` | Implementation Verification | User Task | Candidate: `QA_REVIEWER` | `cc-verify` |
| `effectivenessCheck` | Effectiveness Check | User Task | Candidate: `QA_APPROVER` | `cc-effectiveness` |
| `notifyClosed` | Notify Closure | Service Task | `${notificationDelegate}` | - |
| `escalateImpl` | Escalate Overdue Implementation | Service Task | `${escalationDelegate}` | - |

### Gateways

1. **`raGateway`** (Exclusive) - "RA Review Required?"
   - `regulatoryFilingRequired == true` → `raReview` task
   - `regulatoryFilingRequired == false` → `pendingApproval` task

2. **`approvalGateway`** (Exclusive) - "Approval Decision"
   - `approvalDecision == 'APPROVED'` → `implementation` task
   - `approvalDecision == 'REJECTED'` → `rejectedEnd` (process ends)

### Timer & Escalation

- **Boundary Timer** on `implementation` task: `P30D` (30 days)
  - Non-interrupting (`cancelActivity="false"`)
  - Triggers `escalateImpl` service task via `${escalationDelegate}`
  - Sends escalation notification for overdue implementation

### Service Tasks (Automatic)

1. **`notifyClosed`** - Fires when change control reaches closure
   - Delegate: `${notificationDelegate}`
   - Sends notification: "Change Control Closed: {changeNumber}" to `requestedById`

2. **`escalateImpl`** - Fires 30 days after implementation starts
   - Delegate: `${escalationDelegate}`
   - Escalation type: `IMPLEMENTATION_OVERDUE`

### BPMN Visual Flow

```
[Start] --> [submitChange] --> [impactAssessment] --> [qaReview]
                                                         |
                                                    <raGateway>
                                                    /          \
                                          [raReview]        [pendingApproval]
                                              \                /
                                               +------+------+
                                                      |
                                               <approvalGateway>
                                               /              \
                                    [implementation]      [rejectedEnd]
                                     |        |
                              (30d timer)  [verification]
                                     |           |
                              [escalateImpl]  [effectivenessCheck]
                                                  |
                                            [notifyClosed]
                                                  |
                                               [End]
```

---

## 5. Step-by-Step Walkthrough

### Step 1: Create Change Request (DRAFT)

**Who**: Any user with CREATE permission on CHANGE_CONTROL (END_USER, OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN)

**What happens**:
1. User fills the multi-step form (cc-form component) with:
   - **Step 1 - Description**: Title, description, justification, type, category, classification, priority
   - **Step 2 - Details**: Department, plant site, change owner, affected areas, target implementation date
   - **Step 3 - Regulatory**: Regulatory filing required flag, validation required flag, training required flag, related deviations/CAPAs
2. On save, backend:
   - Generates change number (e.g., `CC-2026-001`) via `SequenceGeneratorService`
   - Creates the `change_requests` record with status `DRAFT`
   - **Starts Flowable process** `changeControlProcess` with all process variables
   - Stores `flowableProcessId` on the record
   - Records audit trail entry: `CREATED`
   - Records workflow step: `Draft` (CURRENT)
   - Sends notification to change owner: "Change Control Assigned"

**Flowable State**: `submitChange` task is active, assigned to `changeOwnerId`

### Step 2: Submit Change Request (DRAFT → SUBMITTED)

**Who**: OWNER, END_USER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN

**What happens**:
1. User clicks "Submit Change Request" on the detail page
2. Backend `transitionStatus()`:
   - Completes Flowable task `submitChange`
   - Records workflow step: "Submit Change" → COMPLETED
   - Records workflow step: "Impact Assessment" → CURRENT
   - Status changes to `SUBMITTED`

**Flowable State**: `impactAssessment` task becomes active, assigned to `changeOwnerId`

### Step 3: Impact Assessment (SUBMITTED → QA_REVIEW)

**Who**: OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN

**What happens**:
1. Change owner opens the Impact Assessment tab on the detail page
2. Clicks "Create Impact Assessment" to open `CcImpactDialogComponent`
3. Fills 8-dimension impact matrix:
   - Product Quality (NO_IMPACT / LOW / MEDIUM / HIGH)
   - Patient Safety
   - Regulatory Compliance
   - Validation Status
   - Documentation
   - Training
   - Supplier Qualification
   - Stability
   - Overall Risk Level (LOW / MEDIUM / HIGH / CRITICAL)
   - Assessment Summary (text)
4. Submits impact assessment → `POST /api/v1/change-requests/{id}/impact-assessment`
5. Can also add:
   - **Affected Documents** → `POST /api/v1/change-requests/{id}/affected-documents`
   - **Affected Products** → `POST /api/v1/change-requests/{id}/affected-products`
6. Clicks "Submit for QA Review" → transitions status to `QA_REVIEW`
7. Backend:
   - Completes Flowable task `impactAssessment`
   - Records workflow steps: "Impact Assessment" COMPLETED, "QA Review" CURRENT

**Flowable State**: `qaReview` task becomes active, assigned to `qaReviewerId`

### Step 4: QA Review (QA_REVIEW → RA_REVIEW or PENDING_APPROVAL)

**Who**: QA_REVIEWER, QA_APPROVER, VAULT_ADMIN

**What happens**:
1. QA Reviewer reviews the change request and impact assessment
2. QA Reviewer can also add approvers at this stage: `POST /api/v1/change-requests/{id}/approvals`
3. Two paths:

   **Path A - Regulatory Filing Required**:
   - QA clicks "Approve QA Review" → routes to `RA_REVIEW`
   - Backend completes `qaReview` with `regulatoryFilingRequired=true`
   - Flowable gateway `raGateway` routes to `raReview` task

   **Path B - No Regulatory Filing**:
   - QA clicks "Approve QA Review" → routes to `PENDING_APPROVAL`
   - Backend completes `qaReview` with `regulatoryFilingRequired=false`
   - Flowable gateway `raGateway` routes to `pendingApproval` task

4. QA can also **Reject** with mandatory comment

### Step 4a: RA Review (RA_REVIEW → PENDING_APPROVAL) [Conditional]

**Who**: REVIEWER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN

**What happens**:
1. RA reviewer evaluates regulatory filing requirements
2. Can approve (→ PENDING_APPROVAL) or reject (→ REJECTED)
3. Backend completes `raReview` Flowable task

**Flowable State**: `pendingApproval` task becomes active, candidate groups: `QA_APPROVER,APPROVER`

### Step 5: Approval (PENDING_APPROVAL → APPROVED/IMPLEMENTATION or REJECTED)

**Who**: QA_APPROVER, APPROVER, VAULT_ADMIN

**What happens**:
1. Approvers are listed on the "Approvals" tab of the detail page
2. Each approver can independently:
   - **Approve**: `PATCH /api/v1/change-requests/{id}/approvals/{approvalId}` with `decision=APPROVED`
   - **Reject**: Same endpoint with `decision=REJECTED` and mandatory comment
3. **Electronic Signature Required** for approval action (21 CFR Part 11)
   - Opens `ESignatureDialogComponent` with meaning statement
   - User enters password + confirms meaning
4. When "Approve Change" workflow button is clicked:
   - Backend completes `pendingApproval` with `approvalDecision=APPROVED`
   - Flowable gateway `approvalGateway` routes to `implementation`
   - Records workflow steps: "Approval" COMPLETED (with "Approved"), "Implementation" CURRENT

**Flowable State**: `implementation` task becomes active, assigned to `changeOwnerId`, with due date `targetImplementationDate`

### Step 6: Implementation (IMPLEMENTATION → VERIFICATION)

**Who**: OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN

**What happens**:
1. Change owner manages implementation tasks on the "Implementation" tab
2. Can add tasks: `POST /api/v1/change-requests/{id}/implementation-tasks`
   - Each task has: title, description, assigned user, department, due date
3. Task lifecycle:
   - `NOT_STARTED` → click "Start" → `IN_PROGRESS`
   - `IN_PROGRESS` → click "Complete" → `COMPLETED` (with completedDate)
4. Progress bar shows percentage of completed tasks
5. If training required, training requirements are tracked on the same tab
6. When all tasks are complete, clicks "Complete Implementation":
   - Backend completes `implementation` Flowable task
   - Sets `actualImplementationDate = now()`
   - Records workflow steps: "Implementation" COMPLETED, "Verification" CURRENT

**Escalation**: If implementation takes > 30 days, Flowable boundary timer fires `escalateImpl` service task

**Flowable State**: `verification` task becomes active, candidate groups: `QA_REVIEWER`

### Step 7: Verification (VERIFICATION → EFFECTIVENESS_CHECK)

**Who**: QA_REVIEWER, QA_APPROVER, VAULT_ADMIN

**What happens**:
1. QA Reviewer verifies all implementation tasks, documents, and training are complete
2. **Electronic Signature Required** for verification
3. Clicks "Verify & Start Effectiveness":
   - Backend completes `verification` Flowable task
   - Records workflow steps: "Verification" COMPLETED, "Effectiveness Check" CURRENT

**Flowable State**: `effectivenessCheck` task becomes active, candidate groups: `QA_APPROVER`

### Step 8: Effectiveness Check (EFFECTIVENESS_CHECK → CLOSED)

**Who**: QA_APPROVER, VAULT_ADMIN

**What happens**:
1. QA Approver opens "Effectiveness" tab, clicks "Submit Effectiveness Review"
2. `CcEffectivenessDialogComponent` opens with fields:
   - Review Date (datepicker)
   - Overall Effective (Yes/No)
   - Summary (text)
   - Criteria (multiple rows): criterion text, met (checkbox), evidence
   - Follow-up Required (checkbox)
   - Follow-up Actions (text, if follow-up required)
3. Submits review → `POST /api/v1/change-requests/{id}/effectiveness-review`
4. **Electronic Signature Required** to close
5. Clicks "Close Change Request":
   - Backend validates closure rules (all tasks done, all approvals obtained, training complete)
   - Sets `closedDate = now()`
   - Completes `effectivenessCheck` Flowable task
   - Flowable `notifyClosed` service task fires → sends notification to requestedById
   - Records workflow steps: "Effectiveness Check" COMPLETED, "Closed" COMPLETED
   - Process ends

**Alternative**: QA can "Reopen Implementation" with comment → goes back to IMPLEMENTATION status

---

## 6. Backend API Reference

### Base URL: `/api/v1/change-requests`

**Controller**: `ChangeRequestController.java`
**Service**: `ChangeRequestService.java`

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| GET | `/` | List change requests (paginated, filterable) | Query params: `status[]`, `classification[]`, `type[]`, `priority[]`, `departmentId`, `plantSiteId`, `search` |
| GET | `/{id}` | Get single change request with all nested data | - |
| POST | `/` | Create new change request | `CreateChangeRequestRequest` |
| PUT | `/{id}` | Update change request details | `UpdateChangeRequestRequest` |
| PATCH | `/{id}/status` | Transition workflow status | `StatusTransitionRequest` (`status`, `comments`) |
| POST | `/{id}/impact-assessment` | Submit impact assessment | `SubmitChangeImpactRequest` |
| PUT | `/{id}/impact-assessment` | Update impact assessment | `SubmitChangeImpactRequest` |
| POST | `/{id}/affected-documents` | Add affected document | `AddAffectedDocumentRequest` |
| POST | `/{id}/affected-products` | Add affected product | `AddAffectedProductRequest` |
| POST | `/{id}/implementation-tasks` | Add implementation task | `AddImplementationTaskRequest` |
| PUT | `/{id}/implementation-tasks/{taskId}` | Update implementation task | `UpdateImplementationTaskRequest` |
| POST | `/{id}/training-requirements` | Add training requirement | `AddTrainingRequirementRequest` |
| POST | `/{id}/approvals` | Add approver | `AddApproverRequest` |
| PATCH | `/{id}/approvals/{approvalId}` | Submit approval decision | `SubmitApprovalDecisionRequest` |
| POST | `/{id}/effectiveness-review` | Submit effectiveness review | `SubmitEffectivenessReviewRequest` |
| GET | `/{id}/workflow-history` | Get workflow step history | - |
| GET | `/{id}/audit-trail` | Get audit trail entries | - |

### Task Inbox APIs (`/api/v1/tasks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inbox` | All tasks for current user (by assignee + candidate groups) |
| GET | `/inbox/count` | Task count for badge display |
| GET | `/by-record-type/CHANGE_CONTROL` | Filter tasks by Change Control |
| POST | `/{taskId}/claim` | Claim a candidate group task |
| POST | `/{taskId}/unclaim` | Release a claimed task |

### Key DTOs

#### CreateChangeRequestRequest
```
title, description, justification, type, category, classification,
priority, departmentId, changeOwnerId, plantSiteId,
targetImplementationDate, affectedAreas[], validationRequired,
trainingRequired, relatedDeviations[], relatedCapas[]
```

#### SubmitChangeImpactRequest
```
productQuality, patientSafety, regulatoryCompliance, validationStatus,
documentation, training, supplierQualification, stability,
overallRiskLevel, assessmentSummary
```

#### AddImplementationTaskRequest
```
title, description, assignedToId, departmentId, dueDate
```

#### AddApproverRequest
```
approverId, role, department, approvalOrder
```

#### SubmitEffectivenessReviewRequest
```
reviewDate, overallEffective, summary, followUpRequired,
followUpActions, criteria[{criterion, met, evidence}]
```

---

## 7. Frontend UI Components

### MFE: `change-control-mfe`

All components are standalone Angular 18 components using Angular Material.

### 7.1 CC Dashboard (`cc-dashboard.component.ts`)

- **Route**: `/change-control` (default)
- **Purpose**: Dashboard with metrics cards and summary charts
- Displays: total open, pending approval, in implementation, overdue, closed this month, avg cycle time, approval rate
- Charts by status, type, classification, priority, department, and monthly trends

### 7.2 CC List (`cc-list.component.ts`)

- **Route**: `/change-control/list`
- **Purpose**: Register/list of all change control records
- Features:
  - Search by title/number
  - Filter by status, classification, type, priority
  - Paginated data table with sortable columns
  - Status color-coded pills
  - Click row → navigate to detail page
  - "New Change Request" button → navigate to form

### 7.3 CC Form (`cc-form.component.ts`)

- **Route**: `/change-control/new` (create) or `/change-control/edit/:id` (edit)
- **Purpose**: Multi-step form to create/edit change requests
- **Angular Material Stepper** with 3 steps:

  **Step 1 - Change Description**:
  - Title (required, max 500)
  - Description (required, textarea)
  - Justification (required, textarea)
  - Change Type (select: PROCESS, EQUIPMENT, FACILITY, DOCUMENT, SYSTEM, MATERIAL, SUPPLIER, REGULATORY, PACKAGING, METHOD)
  - Category (select: PRODUCT, NON_PRODUCT, QUALITY_SYSTEM, REGULATORY_SUBMISSION, SITE, TECHNOLOGY_TRANSFER)
  - Classification (select: MINOR, MAJOR, CRITICAL)
  - Priority (select: URGENT, HIGH, MEDIUM, LOW)

  **Step 2 - Assignment & Details**:
  - Department (select from API)
  - Plant Site (select from API)
  - Change Owner (select from users API)
  - Affected Areas (multi-select)
  - Target Implementation Date (datepicker with click-to-open)

  **Step 3 - Regulatory & References**:
  - Regulatory Filing Required (checkbox)
  - Validation Required (checkbox)
  - Training Required (checkbox)
  - Related Deviations (text array)
  - Related CAPAs (text array)

- **Form Validation**: All required fields validated, stepper enforces step completion

### 7.4 CC Detail (`cc-detail.component.ts`)

- **Route**: `/change-control/detail/:id`
- **Purpose**: Full detail view with workflow actions, tabs, and sub-forms

**Page Header**:
- Change number, title, type badge, classification badge, priority badge, status pill
- Back button to list

**Workflow Action Bar**:
- Dynamic buttons based on current status and user role
- Actions requiring e-signature open `ESignatureDialogComponent`
- Actions requiring comments prompt for reason

**Workflow Progress Stepper**:
- Visual step-by-step progress with icons (check_circle, radio_button_checked, radio_button_unchecked)
- Shows step name, completion date, assigned user

**Tabs**:

| Tab | Content |
|-----|---------|
| **Overview** | General info (type, category, classification, priority, plant site, department, affected areas), people & timeline (requested by, owner, QA reviewer, RA reviewer, dates), description, justification, regulatory & validation flags, cross-references |
| **Impact Assessment** | 8-dimension impact matrix with color-coded ratings, overall risk level badge, assessment summary, assessed by/date, affected documents table, affected products cards. "Create/Edit Impact Assessment" button opens `CcImpactDialogComponent` |
| **Implementation** | Task list with progress bar, each task shows status icon, title, description, assignee, due date. "Add Task" button opens `CcTaskDialogComponent`. Start/Complete buttons on each task during IMPLEMENTATION status. Training requirements section with progress bars |
| **Approvals** | Approval history with approver name, role, department, decision badge, comments, decision date. "Add Approver" button opens `CcApproverDialogComponent`. Approve/Reject buttons on pending approvals during PENDING_APPROVAL status |
| **Effectiveness** | Effectiveness review with overall effective badge, reviewer, date, criteria list (met/not-met icons), summary. "Submit Effectiveness Review" button opens `CcEffectivenessDialogComponent` during EFFECTIVENESS_CHECK |
| **Audit Trail** | Chronological list of all actions with timestamp, user, action, field changes (old→new), comments |

### 7.5 Dialog Components

#### CcImpactDialogComponent (`cc-impact-dialog.component.ts`)
- 8 impact dimension dropdowns (NO_IMPACT, LOW, MEDIUM, HIGH)
- Overall Risk Level dropdown (LOW, MEDIUM, HIGH, CRITICAL)
- Assessment Summary textarea
- Calls `POST /api/v1/change-requests/{id}/impact-assessment`

#### CcTaskDialogComponent (`cc-task-dialog.component.ts`)
- Task title, description, assigned user, department, due date (datepicker)
- Calls `POST /api/v1/change-requests/{id}/implementation-tasks`

#### CcApproverDialogComponent (`cc-approver-dialog.component.ts`)
- Approver selection, role, department, approval order
- Calls `POST /api/v1/change-requests/{id}/approvals`

#### CcEffectivenessDialogComponent (`cc-effectiveness-dialog.component.ts`)
- Review date (datepicker), overall effective toggle, summary
- Dynamic criteria rows (criterion + met checkbox + evidence)
- Follow-up required checkbox, follow-up actions
- Calls `POST /api/v1/change-requests/{id}/effectiveness-review`

#### ESignatureDialogComponent (`e-signature-dialog.component.ts`)
- Record number display, action being signed
- Meaning/reason text field
- Password entry for 21 CFR Part 11 electronic signature
- Returns `{ signed: true, meaning: string }` on successful signature

### 7.6 Change Control Service (`change-control.service.ts`)

- **API Base URL**: `http://localhost:8082/api/v1`
- Workflow template steps: Draft → Submit Change → Impact Assessment → QA Review → RA Review → Pending Approval → Implementation → Verification → Effectiveness Check → Closed
- Methods:
  - `getChangeRequests(filter?)` - List with filters
  - `getChangeRequestById(id)` - Get with full nested data
  - `createChangeRequest(data)` - Create new
  - `updateChangeRequest(id, data)` - Update existing
  - `updateStatus(id, status, comments?)` - Status transition
  - `submitImpactAssessment(id, data)` - Submit impact
  - `addAffectedDocument(id, data)` - Add affected doc
  - `addAffectedProduct(id, data)` - Add affected product
  - `addImplementationTask(id, data)` - Add task
  - `updateImplementationTask(id, taskId, data)` - Update task status
  - `addApprover(id, data)` - Add approver
  - `submitApprovalDecision(id, approvalId, data)` - Submit decision
  - `submitEffectivenessReview(id, data)` - Submit review
  - `getWorkflowHistory(id)` - Get workflow steps
  - `getAuditTrail(id)` - Get audit entries
  - `getDashboardMetrics()` - Dashboard data

---

## 8. Database Schema

### 8.1 Main Table: `change_requests`

```sql
CREATE TABLE change_requests (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_number               VARCHAR(50) NOT NULL UNIQUE,       -- "CC-2026-001"
    title                       VARCHAR(500) NOT NULL,
    description                 TEXT NOT NULL,
    justification               TEXT NOT NULL,
    type                        VARCHAR(30) NOT NULL,              -- PROCESS, EQUIPMENT, etc.
    category                    VARCHAR(30) NOT NULL,              -- PRODUCT, NON_PRODUCT, etc.
    classification              VARCHAR(20) NOT NULL,              -- MINOR, MAJOR, CRITICAL
    status                      VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    priority                    VARCHAR(20) NOT NULL,              -- URGENT, HIGH, MEDIUM, LOW

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

-- Indexes
CREATE INDEX idx_cc_status ON change_requests(status);
CREATE INDEX idx_cc_number ON change_requests(change_number);
CREATE INDEX idx_cc_plant ON change_requests(plant_site_id);
CREATE INDEX idx_cc_department ON change_requests(department_id);
CREATE INDEX idx_cc_owner ON change_requests(change_owner_id);
CREATE INDEX idx_cc_classification ON change_requests(classification);
CREATE INDEX idx_cc_dates ON change_requests(target_implementation_date);
```

### 8.2 Impact Assessment: `change_impact_assessments`

```sql
CREATE TABLE change_impact_assessments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id       UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE UNIQUE,
    product_quality         VARCHAR(20) NOT NULL,   -- NO_IMPACT, LOW, MEDIUM, HIGH
    patient_safety          VARCHAR(20) NOT NULL,
    regulatory_compliance   VARCHAR(20) NOT NULL,
    validation_status       VARCHAR(20) NOT NULL,
    documentation           VARCHAR(20) NOT NULL,
    training                VARCHAR(20) NOT NULL,
    supplier_qualification  VARCHAR(20) NOT NULL,
    stability               VARCHAR(20) NOT NULL,
    overall_risk_level      VARCHAR(20) NOT NULL,   -- LOW, MEDIUM, HIGH, CRITICAL
    assessment_summary      TEXT NOT NULL,
    assessed_by             UUID NOT NULL REFERENCES users(id),
    assessed_date           TIMESTAMPTZ NOT NULL
);
```

### 8.3 Regulatory Filing: `change_regulatory_filings`

```sql
CREATE TABLE change_regulatory_filings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id   UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE UNIQUE,
    filing_required     BOOLEAN NOT NULL DEFAULT FALSE,
    filing_type         VARCHAR(30),       -- CBE_30, CBE_0, PAS, ANNUAL_REPORT, VARIATION_TYPE_*
    markets             TEXT[],
    filing_details      TEXT,
    target_filing_date  TIMESTAMPTZ,
    filing_status       VARCHAR(20)        -- NOT_STARTED, IN_PROGRESS, SUBMITTED, APPROVED
);
```

### 8.4 Affected Documents: `change_affected_documents`

```sql
CREATE TABLE change_affected_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id   UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    document_number     VARCHAR(100) NOT NULL,
    document_title      VARCHAR(500) NOT NULL,
    document_type       VARCHAR(100),
    current_version     VARCHAR(20),
    action              VARCHAR(20) NOT NULL,   -- REVISE, RETIRE, CREATE_NEW, NO_CHANGE
    new_version         VARCHAR(20),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'  -- PENDING, IN_PROGRESS, COMPLETED
);
```

### 8.5 Affected Products: `change_affected_products`

```sql
CREATE TABLE change_affected_products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id   UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    product_name        VARCHAR(255) NOT NULL,
    product_code        VARCHAR(100) NOT NULL,
    dosage_form         VARCHAR(100),
    markets             TEXT[],
    impact_description  TEXT
);
```

### 8.6 Implementation Tasks: `change_implementation_tasks`

```sql
CREATE TABLE change_implementation_tasks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id   UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    task_number         INTEGER NOT NULL,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    assigned_to_id      UUID NOT NULL REFERENCES users(id),
    department_id       UUID REFERENCES departments(id),
    due_date            TIMESTAMPTZ NOT NULL,
    completed_date      TIMESTAMPTZ,
    status              VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',  -- NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED
    comments            TEXT,
    UNIQUE (change_request_id, task_number)
);
```

### 8.7 Training Requirements: `change_training_requirements`

```sql
CREATE TABLE change_training_requirements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id       UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    training_title          VARCHAR(500) NOT NULL,
    target_audience         VARCHAR(255),
    department_id           UUID REFERENCES departments(id),
    training_type           VARCHAR(20),  -- SOP_READ, CLASSROOM, OJT, E_LEARNING, PRACTICAL
    due_date                TIMESTAMPTZ NOT NULL,
    completion_status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED
    completion_percentage   INTEGER NOT NULL DEFAULT 0
);
```

### 8.8 Approvals: `change_approvals`

```sql
CREATE TABLE change_approvals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id   UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    approver_id         UUID NOT NULL REFERENCES users(id),
    role                VARCHAR(100) NOT NULL,
    department          VARCHAR(255),
    decision            VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, APPROVED_WITH_COMMENTS
    comments            TEXT,
    decision_date       TIMESTAMPTZ,
    approval_order      INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.9 Effectiveness Reviews: `change_effectiveness_reviews`

```sql
CREATE TABLE change_effectiveness_reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id   UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    review_date         TIMESTAMPTZ NOT NULL,
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    overall_effective   BOOLEAN NOT NULL,
    summary             TEXT NOT NULL,
    follow_up_required  BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_actions   TEXT
);
```

### 8.10 Effectiveness Criteria: `change_effectiveness_criteria`

```sql
CREATE TABLE change_effectiveness_criteria (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   UUID NOT NULL REFERENCES change_effectiveness_reviews(id) ON DELETE CASCADE,
    criterion   TEXT NOT NULL,
    met         BOOLEAN NOT NULL,
    evidence    TEXT NOT NULL
);
```

### 8.11 Shared Tables

```sql
-- Workflow History (dual tracking with Flowable)
CREATE TABLE workflow_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type     VARCHAR(30) NOT NULL,     -- 'CHANGE_CONTROL'
    record_id       UUID NOT NULL,
    step_name       VARCHAR(100) NOT NULL,
    status          VARCHAR(20) NOT NULL,     -- CURRENT, COMPLETED
    assigned_to_id  UUID REFERENCES users(id),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    comments        TEXT,
    step_order      INTEGER NOT NULL,
    flowable_task_id VARCHAR(255)
);

-- Audit Trail
CREATE TABLE audit_trail (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type     VARCHAR(30) NOT NULL,     -- 'CHANGE_CONTROL'
    record_id       UUID NOT NULL,
    record_number   VARCHAR(50),
    action          VARCHAR(50) NOT NULL,     -- CREATED, UPDATED, STATUS_CHANGED, etc.
    field_name      VARCHAR(100),
    old_value       TEXT,
    new_value       TEXT,
    comments        TEXT,
    performed_by    UUID NOT NULL REFERENCES users(id),
    performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    notification_type   VARCHAR(30) NOT NULL,  -- TASK_ASSIGNED, STATUS_CHANGE, etc.
    record_type         VARCHAR(30),
    record_id           UUID,
    record_number       VARCHAR(50),
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMPTZ,
    priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Entity Relationships Diagram

```
change_requests (1)
    |
    +-- (1:1) change_impact_assessments
    +-- (1:1) change_regulatory_filings
    +-- (1:N) change_affected_documents
    +-- (1:N) change_affected_products
    +-- (1:N) change_implementation_tasks
    +-- (1:N) change_training_requirements
    +-- (1:N) change_approvals
    +-- (1:N) change_effectiveness_reviews
                    |
                    +-- (1:N) change_effectiveness_criteria
```

---

## 9. Notifications

### When Notifications Are Sent

| Event | Recipient | Title | Message | Type |
|-------|-----------|-------|---------|------|
| CC Created | Change Owner | "Change Control Assigned" | "You are the owner of change control CC-2026-001" | `TASK_ASSIGNED` |
| CC Closed (Flowable) | Requested By | "Change Control Closed: CC-2026-001" | "Change control CC-2026-001 has been closed" | `STATUS_CHANGE` |
| Implementation Overdue (Flowable) | Escalation targets | Escalation notification | Implementation overdue alert | `ESCALATION` |

### Notification Flow

```
ChangeRequestService.create()
    |
    +-- NotificationService.send(changeOwner, "Change Control Assigned", ...)

Flowable Process (automatic):
    |
    +-- notifyClosed service task → NotificationDelegate → sends to requestedById
    +-- escalateImpl service task → EscalationDelegate → sends overdue alert
```

### Notification Entity Fields

- `id` (UUID), `user_id`, `title`, `message`
- `notification_type` (TASK_ASSIGNED, STATUS_CHANGE, ESCALATION, etc.)
- `record_type` ("CHANGE_CONTROL"), `record_id`, `record_number`
- `is_read`, `read_at`, `priority`, `created_at`

---

## 10. Task Inbox

### How Change Control Tasks Appear

The `TaskInboxService` queries Flowable's task engine and maps tasks to Change Control records.

**Process Resolution**:
```java
case "changeControlProcess" -> "CHANGE_CONTROL"
```

**Record Number Resolution**:
```java
if ("changeControlProcess".equals(processDefKey))
    return (String) vars.get("changeNumber");
```

### Task Inbox Response for CC

Each inbox task includes:
- `taskId` - Flowable task ID
- `taskName` - e.g., "QA Review", "Pending Approval"
- `taskDefinitionKey` - e.g., "qaReview", "pendingApproval"
- `recordType` - "CHANGE_CONTROL"
- `recordId` - Change request UUID
- `recordNumber` - e.g., "CC-2026-001"
- `assignee` - User ID (if directly assigned)
- `createTime` - When the task was created
- `dueDate` - Task due date (implementation uses targetImplementationDate)
- `formKey` - e.g., "cc-qa-review"
- `priority` - Task priority

### Task Assignment Rules

| Task | Assignment | Who Sees It |
|------|-----------|-------------|
| submitChange | Direct: `changeOwnerId` | Change Owner only |
| impactAssessment | Direct: `changeOwnerId` | Change Owner only |
| qaReview | Direct: `qaReviewerId` | QA Reviewer assigned |
| raReview | Candidate: `QA_REVIEWER` | Any QA Reviewer (claim to take) |
| pendingApproval | Candidate: `QA_APPROVER,APPROVER` | Any QA Approver or Approver |
| implementation | Direct: `changeOwnerId` | Change Owner only |
| verification | Candidate: `QA_REVIEWER` | Any QA Reviewer |
| effectivenessCheck | Candidate: `QA_APPROVER` | Any QA Approver |

### Claiming Tasks

For candidate group tasks (raReview, pendingApproval, verification, effectivenessCheck):
1. Task appears in inbox of all users in that role group
2. User clicks "Claim" → `POST /api/v1/tasks/{taskId}/claim`
3. Task becomes exclusively assigned to that user
4. Other users no longer see it in their inbox
5. User can "Unclaim" → `POST /api/v1/tasks/{taskId}/unclaim` to release it back

---

## 11. Audit Trail

### Logged Events

| Action | Field | Old Value | New Value | When |
|--------|-------|-----------|-----------|------|
| `CREATED` | - | - | - | On creation |
| `UPDATED` | - | - | - | On field updates |
| `STATUS_CHANGED` | `status` | e.g., `DRAFT` | e.g., `SUBMITTED` | On every status transition |
| `IMPACT_ASSESSMENT_SUBMITTED` | - | - | - | When impact assessment saved |
| `APPROVAL_DECISION` | `decision` | `PENDING` | `APPROVED`/`REJECTED` | When approver decides |
| `EFFECTIVENESS_REVIEW_SUBMITTED` | - | - | - | When effectiveness review saved |

### Audit Trail Service

```java
auditTrailService.logAction(
    "CHANGE_CONTROL",           // recordType
    cr.getId(),                 // recordId
    cr.getChangeNumber(),       // recordNumber
    "STATUS_CHANGED",           // action
    "status",                   // field (optional)
    oldStatus,                  // old value (optional)
    newStatus.name(),           // new value (optional)
    request.getComments()       // comments (optional)
);
```

### Dual Tracking

The system maintains two parallel tracking mechanisms:

1. **Audit Trail** (`audit_trail` table) - Records WHAT happened (actions, field changes, comments)
2. **Workflow History** (`workflow_history` table) - Records WHERE in the workflow (step names, assignments, completion)

Both are accessible via separate API endpoints:
- `GET /api/v1/change-requests/{id}/audit-trail`
- `GET /api/v1/change-requests/{id}/workflow-history`

---

## 12. Complete End-to-End Scenario

### Scenario: Process Temperature Range Change

A pharma company needs to change the granulation temperature range from 55-65°C to 50-60°C based on process development data.

---

**Day 1 - Initiation (Production Engineer)**

Role: `END_USER`

1. Logs in → navigates to Change Control → clicks "New Change Request"
2. Fills form:
   - Title: "Modify granulation temperature range for Product Alpha"
   - Description: "Change granulation temperature from 55-65°C to 50-60°C..."
   - Justification: "Process development study PD-2026-008 shows improved dissolution..."
   - Type: `PROCESS`
   - Category: `PRODUCT`
   - Classification: `MAJOR`
   - Priority: `HIGH`
   - Department: Production
   - Plant Site: Hyderabad Plant 1
   - Change Owner: Rajesh Kumar (Production Manager)
   - Target Implementation Date: 45 days from now
   - Regulatory Filing Required: Yes
   - Validation Required: Yes
   - Training Required: Yes
   - Related Deviations: DEV-2026-005
3. Submits form → CC-2026-001 created in DRAFT status
4. System:
   - Starts Flowable `changeControlProcess`
   - Sends notification to Rajesh Kumar: "Change Control Assigned"
   - `submitChange` task active in Flowable

---

**Day 2 - Submit (Change Owner: Rajesh Kumar)**

Role: `OWNER`

1. Sees notification → opens CC-2026-001 detail page
2. Reviews all details, adds supporting documents
3. Clicks "Submit Change Request"
4. System transitions to SUBMITTED → `impactAssessment` task active

---

**Day 3-5 - Impact Assessment (Change Owner: Rajesh Kumar)**

Role: `OWNER`

1. Opens Impact Assessment tab → clicks "Create Impact Assessment"
2. Fills 8-dimension matrix:
   - Product Quality: HIGH
   - Patient Safety: MEDIUM
   - Regulatory Compliance: HIGH
   - Validation Status: HIGH
   - Documentation: MEDIUM
   - Training: MEDIUM
   - Supplier Qualification: NO_IMPACT
   - Stability: HIGH
   - Overall Risk Level: HIGH
   - Summary: "Major process parameter change affecting dissolution..."
3. Adds Affected Documents:
   - BMR-001 (Batch Manufacturing Record) → REVISE to v3.0
   - SOP-GRAN-005 (Granulation SOP) → REVISE to v2.0
   - VP-001 (Validation Protocol) → CREATE_NEW
4. Adds Affected Products:
   - Product Alpha (PA-100, Tablet, Markets: India, US, EU)
5. Clicks "Submit for QA Review"
6. System transitions to QA_REVIEW → `qaReview` task active

---

**Day 6-10 - QA Review (QA Manager: Priya Sharma)**

Role: `QA_REVIEWER`

1. Sees `qaReview` task in inbox → opens CC-2026-001
2. Reviews change description, justification, impact assessment
3. Adds Approvers:
   - VP Quality (QA_APPROVER, order 1)
   - Regulatory Affairs Head (APPROVER, order 2)
   - Plant Director (APPROVER, order 3)
4. Since regulatory filing is required, clicks "Approve QA Review"
5. System detects `regulatoryFilingRequired=true` → routes to RA_REVIEW
6. `raReview` task active (candidate group: QA_REVIEWER)

---

**Day 11-15 - RA Review (RA Head claims task)**

Role: `QA_REVIEWER` / `REVIEWER`

1. RA Head sees `raReview` task in inbox → clicks "Claim"
2. Reviews regulatory impact, determines filing type: CBE-30 (Changes Being Effected in 30 days)
3. Markets affected: US, EU
4. Clicks "Approve RA Review"
5. System transitions to PENDING_APPROVAL → `pendingApproval` task active

---

**Day 16-18 - Approval (Multiple Approvers)**

Role: `QA_APPROVER`, `APPROVER`

1. VP Quality (QA_APPROVER) sees task → opens CC-2026-001 → Approvals tab
2. Clicks "Approve" → E-Signature dialog opens:
   - Confirms meaning: "I confirm the approve change for CC-2026-001"
   - Enters password → signs
   - Decision: APPROVED with e-signature comment
3. RA Head (APPROVER) similarly approves
4. Plant Director (APPROVER) similarly approves
5. After all approvals, clicks "Approve Change" workflow button
6. System:
   - Completes `pendingApproval` with `approvalDecision=APPROVED`
   - Flowable routes to `implementation` task
   - 30-day escalation timer starts
   - Status: APPROVED → IMPLEMENTATION

---

**Day 19 - Start Implementation (Change Owner: Rajesh Kumar)**

Role: `OWNER`

1. Opens CC-2026-001 → Implementation tab
2. Adds implementation tasks:
   - Task 1: "Update BMR-001 granulation section" → assigned to Doc Control, due: Day 30
   - Task 2: "Revise SOP-GRAN-005" → assigned to Production, due: Day 25
   - Task 3: "Execute validation protocol VP-001 (3 batches)" → assigned to QC, due: Day 45
   - Task 4: "Conduct operator training on new parameters" → assigned to Training, due: Day 40
   - Task 5: "Update stability protocol for 50-60°C range" → assigned to Stability, due: Day 35

---

**Day 20-45 - Task Execution (Various Departments)**

Multiple users work on tasks:
1. Doc Control completes BMR revision → clicks "Start" then "Complete" on Task 1
2. Production completes SOP revision → Task 2 complete
3. Stability updates protocol → Task 5 complete
4. Training conducts sessions → Task 4 complete
5. QC executes 3 validation batches → Task 3 complete
6. Progress bar shows 100%

---

**Day 46 - Complete Implementation (Change Owner: Rajesh Kumar)**

Role: `OWNER`

1. Verifies all 5 tasks show COMPLETED
2. Clicks "Complete Implementation"
3. System:
   - Sets `actualImplementationDate = now()`
   - Completes `implementation` Flowable task
   - Cancels 30-day escalation timer
   - `verification` task active (candidate: QA_REVIEWER)

---

**Day 47-50 - Verification (QA Manager: Priya Sharma)**

Role: `QA_REVIEWER`

1. Claims `verification` task from inbox
2. Verifies:
   - All 5 implementation tasks completed
   - BMR and SOP revisions reviewed and approved
   - Validation report shows all 3 batches passed
   - Training records complete
   - Stability protocol updated
3. Clicks "Verify & Start Effectiveness" → E-Signature dialog
4. Signs and confirms
5. System transitions to EFFECTIVENESS_CHECK → `effectivenessCheck` task active

---

**Day 80-90 - Effectiveness Check (VP Quality)**

Role: `QA_APPROVER`

1. Claims `effectivenessCheck` task
2. Opens Effectiveness tab → clicks "Submit Effectiveness Review"
3. Fills review:
   - Review Date: Today
   - Overall Effective: Yes
   - Criteria:
     - "Dissolution profiles meet specifications" → Met, Evidence: "Batch 1-3 dissolution data"
     - "Process capability Cpk > 1.33" → Met, Evidence: "Statistical analysis report"
     - "No OOS/OOT results in stability" → Met, Evidence: "3-month stability data"
     - "All operators trained and assessed" → Met, Evidence: "Training records"
   - Summary: "Change implemented successfully. All criteria met."
   - Follow-up Required: No
4. Submits effectiveness review
5. Clicks "Close Change Request" → E-Signature dialog → signs
6. System:
   - Validates: all tasks complete, all approvals obtained, training complete
   - Sets `closedDate = now()`
   - Completes `effectivenessCheck` Flowable task
   - `notifyClosed` service task fires → sends notification to original requestor
   - Process ends
   - Status: CLOSED

---

### Final State

- **CC-2026-001**: CLOSED
- **Workflow History**: 9 completed steps (Draft → ... → Closed)
- **Audit Trail**: ~15+ entries covering creation, status changes, impact assessment, approvals, effectiveness review
- **Notifications**: Sent to change owner (assignment), original requestor (closure)
- **All documents revised, validated, training completed, effectiveness verified**
- **Full 21 CFR Part 11 compliant audit trail with electronic signatures**

---

## Configuration

### System Settings (from seed data)

| Key | Default | Type | Description |
|-----|---------|------|-------------|
| `change.control.default.closure.days` | `120` | INTEGER | Default days for change control closure target |

### Sequence Generator

- Sequence name: `CHANGE_CONTROL`
- Format: `CC-{YEAR}-{SEQUENCE}` (e.g., CC-2026-001)
- Auto-increments per year

---

*This document reflects the current codebase as of June 2026. File locations:*
- *Backend Service: `backend/src/main/java/com/qmspharma/service/ChangeRequestService.java`*
- *Controller: `backend/src/main/java/com/qmspharma/controller/ChangeRequestController.java`*
- *BPMN Process: `backend/src/main/resources/processes/change-control-process.bpmn20.xml`*
- *Entity: `backend/src/main/java/com/qmspharma/model/entity/ChangeRequest.java`*
- *DDL: `backend/src/main/resources/db/migration/V1__create_schema.sql`*
- *UI Detail: `change-control-mfe/src/app/change-control/components/cc-detail/cc-detail.component.ts`*
- *UI Form: `change-control-mfe/src/app/change-control/components/cc-form/cc-form.component.ts`*
- *UI Service: `change-control-mfe/src/app/change-control/services/change-control.service.ts`*
- *UI Models: `change-control-mfe/src/app/change-control/models/change-control.model.ts`*

1. Overview - Architecture diagram, key characteristics
2. Statuses & Lifecycle - 13 statuses with flow diagram, closure validation rules
3. Roles & Permissions - 7 roles with per-status permission matrix
4. Flowable BPMN - 8 user tasks, 2 gateways (RA routing + approval decision), 30-day escalation timer, 2 service tasks
5. Step-by-Step Walkthrough - All 8 steps from DRAFT to CLOSED with Flowable state tracking
6. Backend API - 17 REST endpoints with full DTO details
7. Frontend UI - 6 components + 5 dialogs (impact, task, approver, effectiveness, e-signature)
8. Database Schema - 10 tables with complete DDL and relationship diagram
9. Notifications - Creation, closure (Flowable), and escalation triggers
10. Task Inbox - Assignment rules, candidate groups, claim/unclaim flow
11. Audit Trail - 6 logged event types with dual tracking (audit + workflow history)
12. End-to-End Scenario - Realistic pharma example (granulation temperature change) walking through every role and stage
