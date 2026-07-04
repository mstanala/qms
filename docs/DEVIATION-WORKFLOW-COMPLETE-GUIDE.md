# Deviation Management - Complete Workflow Guide

## Table of Contents
1. [Overview](#1-overview)
2. [Roles & Permissions](#2-roles--permissions)
3. [Deviation Statuses](#3-deviation-statuses)
4. [Database Tables (DDL)](#4-database-tables-ddl)
5. [Flowable BPMN Process](#5-flowable-bpmn-process)
6. [Backend API Endpoints](#6-backend-api-endpoints)
7. [Complete Workflow - Step by Step](#7-complete-workflow---step-by-step)
8. [Notifications](#8-notifications)
9. [Task Inbox Integration](#9-task-inbox-integration)
10. [Frontend UI Components](#10-frontend-ui-components)
11. [Audit Trail](#11-audit-trail)
12. [Closure Validation Rules](#12-closure-validation-rules)

---

## 1. Overview

The Deviation Management module tracks unplanned and planned deviations from approved procedures, specifications, and established standards in pharmaceutical manufacturing. It manages the full lifecycle from initial reporting through investigation, impact assessment, disposition, optional CAPA initiation, and final closure.

**Process ID:** `deviationProcess`
**Record Type:** `DEVIATION`
**Number Format:** `DEV-YYYY-NNN` (e.g., DEV-2026-001)

### Key Features
- Full FDA 21 CFR Part 11 compliant audit trail
- Flowable BPMN 2.0 workflow engine integration
- Role-based workflow actions with electronic signatures
- 4-dimension impact assessment (Product Quality, Patient Safety, Regulatory, Business)
- Conditional CAPA initiation gateway
- 25-day investigation overdue escalation timer
- Attachment management with drag-and-drop upload

---

## 2. Roles & Permissions

| Role Code | Role Name | Key Responsibilities |
|-----------|-----------|---------------------|
| `END_USER` | Production Engineer / Operator | Report deviations, submit for review |
| `OWNER` | Deviation Owner / Investigator | Conduct investigation, submit findings |
| `QA_REVIEWER` | QA Reviewer | Classify deviation, review investigation, perform impact assessment, initiate CAPA |
| `QA_APPROVER` | QA Approver | Approve disposition, close deviation (with e-signature) |
| `REVIEWER` | Investigator / SME | Perform root cause investigation |
| `VAULT_ADMIN` | System Administrator | Full access to all workflow actions |

### Role-Based Workflow Actions (from UI `getAvailableActions()`)

| Status | Action | Allowed Roles |
|--------|--------|--------------|
| REPORTED | Submit for Review | END_USER, OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN |
| UNDER_REVIEW | Classify & Assign | QA_REVIEWER, QA_APPROVER, VAULT_ADMIN |
| UNDER_REVIEW | Reject | QA_REVIEWER, QA_APPROVER, VAULT_ADMIN |
| CLASSIFIED | Start Investigation | REVIEWER, OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN |
| INVESTIGATION | Submit Investigation | REVIEWER, OWNER, QA_REVIEWER, QA_APPROVER, VAULT_ADMIN |
| INVESTIGATION | Return for Rework | QA_REVIEWER, QA_APPROVER, VAULT_ADMIN |
| IMPACT_ASSESSMENT | Submit for Disposition | QA_REVIEWER, QA_APPROVER, VAULT_ADMIN |
| DISPOSITION | Approve Disposition (E-Sign) | QA_APPROVER, VAULT_ADMIN |
| DISPOSITION | Initiate CAPA | QA_REVIEWER, OWNER, QA_APPROVER, VAULT_ADMIN |
| DISPOSITION | Reject | QA_APPROVER, VAULT_ADMIN |
| CAPA_INITIATED | Move to Pending Closure | QA_REVIEWER, QA_APPROVER, VAULT_ADMIN |
| PENDING_CLOSURE | Close Deviation (E-Sign) | QA_APPROVER, VAULT_ADMIN |

---

## 3. Deviation Statuses

```
REPORTED -> UNDER_REVIEW -> CLASSIFIED -> INVESTIGATION -> IMPACT_ASSESSMENT -> DISPOSITION
                |                                                                    |
                v                                                         +----------+----------+
             REJECTED                                                     |                     |
                                                                   CAPA_INITIATED         PENDING_CLOSURE
                                                                          |                     |
                                                                          +------> PENDING_CLOSURE
                                                                                        |
                                                                                      CLOSED
```

| Status | Description | Workflow Step |
|--------|-------------|---------------|
| `REPORTED` | Deviation initially reported by any user | Reported |
| `UNDER_REVIEW` | QA Reviewer is evaluating the deviation | QA Review & Classification |
| `CLASSIFIED` | Classification assigned (Critical/Major/Minor), investigator assigned | QA Review & Classification |
| `INVESTIGATION` | Root cause investigation in progress | Investigation |
| `IMPACT_ASSESSMENT` | Impact on quality, safety, regulatory being assessed | Impact Assessment |
| `DISPOSITION` | QA Approver deciding batch disposition | Disposition |
| `CAPA_INITIATED` | CAPA record created and linked | CAPA Initiation |
| `PENDING_CLOSURE` | Final QA review before closure | Pending Closure |
| `CLOSED` | Deviation fully resolved and closed | Closed |
| `REJECTED` | Deviation rejected during review | (Process ends) |

### Enums

**DeviationType:** `PLANNED`, `UNPLANNED`

**DeviationCategory:** `PROCESS`, `EQUIPMENT`, `MATERIAL`, `DOCUMENTATION`, `ENVIRONMENTAL`, `PERSONNEL`, `UTILITY`, `LABORATORY`, `PACKAGING`, `CLEANING`

**DeviationClassification:** `CRITICAL`, `MAJOR`, `MINOR`

**DispositionDecision:** `USE_AS_IS`, `RELEASE`, `RELEASE_WITH_CONDITIONS`, `REJECT`, `QUARANTINE`, `REPROCESS`, `REWORK`, `RETURN_TO_SUPPLIER`

**ImpactLevel:** `NONE`, `LOW`, `MEDIUM`, `HIGH`

---

## 4. Database Tables (DDL)

### 4.1 Main Table: `deviations`

```sql
CREATE TABLE deviations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,              -- PLANNED, UNPLANNED
    category VARCHAR(50) NOT NULL,          -- PROCESS, EQUIPMENT, etc.
    classification VARCHAR(20),             -- CRITICAL, MAJOR, MINOR
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
    source_area VARCHAR(200),
    occurred_date TIMESTAMP NOT NULL,
    reported_date TIMESTAMP NOT NULL DEFAULT NOW(),
    detected_date TIMESTAMP,
    target_closure_date TIMESTAMP,
    actual_closure_date TIMESTAMP,
    reported_by_id UUID REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    plant_site_id UUID REFERENCES plant_sites(id),
    department_id UUID REFERENCES departments(id),
    area VARCHAR(200),
    equipment VARCHAR(200),
    product VARCHAR(200),
    batch_number VARCHAR(100),
    batch_size VARCHAR(100),
    gmp_impact BOOLEAN DEFAULT FALSE,
    patient_safety_impact BOOLEAN DEFAULT FALSE,
    regulatory_impact BOOLEAN DEFAULT FALSE,
    capa_required BOOLEAN DEFAULT FALSE,
    capa_id UUID REFERENCES capas(id),
    current_workflow_step VARCHAR(100),
    flowable_process_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

### 4.2 `deviation_affected_batches`

```sql
CREATE TABLE deviation_affected_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_id UUID NOT NULL REFERENCES deviations(id),
    batch_number VARCHAR(100) NOT NULL,
    product_name VARCHAR(200),
    batch_size VARCHAR(100),
    manufacturing_date TIMESTAMP,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 `deviation_investigations`

```sql
CREATE TABLE deviation_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_id UUID NOT NULL UNIQUE REFERENCES deviations(id),
    investigator_id UUID REFERENCES users(id),
    start_date TIMESTAMP,
    completed_date TIMESTAMP,
    probable_cause TEXT,
    root_cause TEXT,
    findings TEXT,
    conclusion TEXT,
    method VARCHAR(100),                    -- 5 Why Analysis, Fishbone, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.4 `deviation_immediate_actions`

```sql
CREATE TABLE deviation_immediate_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES deviation_investigations(id),
    action_description TEXT NOT NULL,
    action_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.5 `deviation_impact_assessments`

```sql
CREATE TABLE deviation_impact_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_id UUID NOT NULL UNIQUE REFERENCES deviations(id),
    product_quality_impact VARCHAR(20),     -- NONE, LOW, MEDIUM, HIGH
    patient_safety_impact VARCHAR(20),
    regulatory_impact VARCHAR(20),
    business_impact VARCHAR(20),
    overall_risk_level VARCHAR(20),         -- LOW, MEDIUM, HIGH, CRITICAL
    affected_products TEXT,
    affected_batches TEXT,
    batch_disposition VARCHAR(200),
    justification TEXT,
    assessed_by_id UUID REFERENCES users(id),
    assessed_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.6 `deviation_dispositions`

```sql
CREATE TABLE deviation_dispositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_id UUID NOT NULL UNIQUE REFERENCES deviations(id),
    decision VARCHAR(50) NOT NULL,          -- USE_AS_IS, RELEASE, REJECT, etc.
    justification TEXT,
    conditions TEXT,
    qa_review_comments TEXT,
    approved_by_id UUID REFERENCES users(id),
    approved_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Supporting Tables (shared across modules)

- `workflow_history` - Tracks workflow step progression (stepName, status, assignedTo, startedAt, completedAt)
- `audit_trail` - Field-level change tracking (action, fieldName, oldValue, newValue, userId, timestamp)
- `notifications` - In-app notifications (type, title, message, recipientId, read status)
- `attachments` - File attachments with recordType and recordId polymorphic linkage

---

## 5. Flowable BPMN Process

**Process Definition:** `deviation-process.bpmn20.xml`
**Process ID:** `deviationProcess`

### Process Elements

| Element | Type | ID | Assignment | Description |
|---------|------|-----|-----------|-------------|
| Start Event | startEvent | `start` | - | Deviation Reported |
| QA Review | userTask | `qaReview` | candidateGroups: `QA_REVIEWER` | Review and classify (Critical/Major/Minor) |
| Notify Investigator | serviceTask | `notifyInvestigator` | notificationDelegate | Sends TASK_ASSIGNED notification to assignedToId |
| Investigation | userTask | `investigation` | assignee: `${assignedToId}` | Root cause investigation with due date |
| Impact Assessment | userTask | `impactAssessment` | candidateGroups: `QA_REVIEWER,QA_APPROVER` | 4-dimension impact assessment |
| Disposition | userTask | `disposition` | candidateGroups: `QA_APPROVER` | Batch disposition decision |
| CAPA Gateway | exclusiveGateway | `capaGateway` | - | Routes based on `${capaRequired}` |
| CAPA Initiation | userTask | `capaInitiation` | candidateGroups: `QA_REVIEWER,OWNER` | Create linked CAPA record |
| Pending Closure | userTask | `pendingClosure` | candidateGroups: `QA_APPROVER` | Final QA review and closure |
| Notify Closed | serviceTask | `notifyClosed` | notificationDelegate | Sends STATUS_CHANGE notification to reportedById |
| End Event | endEvent | `end` | - | Deviation Closed |
| Investigation Timer | boundaryEvent | `investigationTimer` | - | P25D non-interrupting timer |
| Escalate Overdue | serviceTask | `escalateOverdue` | escalationDelegate | INVESTIGATION_OVERDUE escalation |

### Process Variables

| Variable | Type | Set By | Used By |
|----------|------|--------|---------|
| `recordId` | UUID | create() | All tasks |
| `deviationNumber` | String | create() | Notifications, Task Inbox |
| `reportedById` | UUID | create() | notifyClosed service task |
| `assignedToId` | UUID | classify() | investigation task assignee, notifyInvestigator |
| `reviewerId` | UUID | classify() | Reference |
| `classification` | String | classify() | Reference |
| `capaRequired` | Boolean | submitDisposition() | capaGateway condition |
| `plantSiteId` | UUID | create() | Reference |
| `departmentId` | UUID | create() | Reference |
| `targetClosureDate` | Date | create() | investigation task dueDate |

### Flow Sequence

```
start -> qaReview -> notifyInvestigator -> investigation -> impactAssessment -> disposition
    -> capaGateway
        -> [capaRequired=true]  -> capaInitiation -> pendingClosure
        -> [capaRequired=false] -> pendingClosure
    -> notifyClosed -> end

investigation --[P25D timer]--> escalateOverdue -> escalationEnd
```

---

## 6. Backend API Endpoints

**Base URL:** `/api/v1/deviations`
**Controller:** `DeviationController.java`
**Service:** `DeviationService.java`

| # | Method | Endpoint | Purpose | Role Required |
|---|--------|----------|---------|---------------|
| 1 | GET | `/api/v1/deviations` | List with filters (status, classification, category, type, search) | Any authenticated |
| 2 | GET | `/api/v1/deviations/{id}` | Get deviation by ID | Any authenticated |
| 3 | POST | `/api/v1/deviations` | Create new deviation | Any authenticated |
| 4 | PUT | `/api/v1/deviations/{id}` | Update deviation details | Any authenticated |
| 5 | PATCH | `/api/v1/deviations/{id}/classify` | Classify deviation (set classification, assign investigator) | QA_REVIEWER |
| 6 | PATCH | `/api/v1/deviations/{id}/assign` | Assign/reassign investigator | QA_REVIEWER, QA_APPROVER |
| 7 | POST | `/api/v1/deviations/{id}/investigation` | Submit investigation results | Assignee |
| 8 | PUT | `/api/v1/deviations/{id}/investigation` | Update investigation | Assignee |
| 9 | POST | `/api/v1/deviations/{id}/impact-assessment` | Submit impact assessment | QA_REVIEWER, QA_APPROVER |
| 10 | POST | `/api/v1/deviations/{id}/disposition` | Submit disposition decision | QA_APPROVER |
| 11 | PATCH | `/api/v1/deviations/{id}/status` | Transition status (CLOSED, CAPA_INITIATED, etc.) | Role-dependent |
| 12 | GET | `/api/v1/deviations/{id}/audit-trail` | Get audit trail entries | Any authenticated |
| 13 | GET | `/api/v1/deviations/{id}/workflow-history` | Get workflow step history | Any authenticated |

### Task Inbox Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/tasks/inbox` | Get all tasks for current user |
| GET | `/api/v1/tasks/inbox/count` | Get task count (badge) |
| GET | `/api/v1/tasks/by-record-type/DEVIATION` | Filter deviation tasks only |
| POST | `/api/v1/tasks/{taskId}/claim` | Claim a candidate group task |
| POST | `/api/v1/tasks/{taskId}/unclaim` | Release a claimed task |

---

## 7. Complete Workflow - Step by Step

### Step 1: Report Deviation (Status: REPORTED)

**Who:** Any authenticated user (Production Engineer, Operator, Analyst)
**UI:** Deviation Form Component (`deviation-form.component.ts`)

**Form Fields (3-step stepper):**

*Step 1 - Event Details:*
- Title (required)
- Description (required)
- Type: Planned/Unplanned (required)
- Category: Process/Equipment/Material/etc. (required)
- Initial Classification: Critical/Major/Minor (required)
- Date/Time Occurred (required)
- Date/Time Detected (required)
- Source Area (required)

*Step 2 - Location & Product:*
- Plant Site (required, dropdown from API)
- Department (required, filtered by plant site)
- Area/Room (required)
- Equipment (optional)
- Product (optional)
- Batch Number (optional)
- Assigned To (required, user dropdown)
- Target Closure Date (required)
- Impact flags: GMP Impact, Patient Safety Impact, Regulatory Impact (checkboxes)

*Step 3 - Review & Submit:*
- Summary review of all entered data
- 21 CFR Part 11 compliance notice
- Submit or Save as Draft

**Backend (`DeviationService.create()`):**
1. Generate deviation number: `DEV-YYYY-NNN`
2. INSERT into `deviations` table with status = `REPORTED`
3. Start Flowable process: `runtimeService.startProcessInstanceByKey("deviationProcess", vars)`
   - Process variables: recordId, deviationNumber, reportedById, assignedToId, classification, plantSiteId, departmentId, targetClosureDate
4. Store `flowableProcessId` on the deviation record
5. Flowable creates first user task: `qaReview` (candidateGroups: QA_REVIEWER)
6. Record workflow step: "Reported" = COMPLETED
7. Record workflow step: "QA Review & Classification" = CURRENT
8. Record audit trail: CREATED
9. Return 201 Created

---

### Step 2: QA Review & Classification (Status: UNDER_REVIEW -> CLASSIFIED)

**Who:** QA Reviewer (QA_REVIEWER role)

**How the QA Reviewer sees it:**
1. QA Reviewer logs in, navigates to **Task Inbox**
2. Task Inbox calls `GET /api/v1/tasks/inbox` which queries Flowable `TaskService`:
   - By assignee (user ID)
   - By candidate groups (user's role codes)
3. The `qaReview` task appears with recordType=DEVIATION, recordNumber=DEV-2026-001
4. QA Reviewer clicks the task, navigated to deviation detail page

**Actions available (from `getAvailableActions()`):**
- "Classify & Assign" -> moves to CLASSIFIED
- "Reject" -> moves to REJECTED (requires comment)

**Backend (`DeviationService.classify()`):**
1. Validates user has QA_REVIEWER role
2. Sets classification (CRITICAL/MAJOR/MINOR) on deviation
3. Assigns investigator (sets assignedToId)
4. Completes Flowable `qaReview` task: `workflowService.completeTask(processId, "qaReview", vars)`
5. Flowable moves to `notifyInvestigator` service task (automatic)
6. `notifyInvestigator` sends TASK_ASSIGNED notification to assignedToId:
   - Title: "Investigation Assigned: DEV-2026-001"
   - Message: "You have been assigned to investigate deviation DEV-2026-001"
7. Flowable then creates `investigation` user task (assignee: assignedToId)
8. Update status to CLASSIFIED
9. Record workflow steps: "QA Review & Classification" = COMPLETED, "Investigation" = CURRENT
10. Record audit trail: STATUS_CHANGED, CLASSIFICATION_SET

---

### Step 3: Root Cause Investigation (Status: INVESTIGATION)

**Who:** Assigned Investigator (OWNER/REVIEWER role, or the specific assignedToId)

**How the Investigator sees it:**
1. Investigator receives notification: "Investigation Assigned: DEV-2026-001"
2. Navigates to Task Inbox or directly to deviation detail
3. The `investigation` Flowable task is assigned directly to them (not candidate group)

**UI - Investigation Form (inline in detail component):**
- Method: dropdown (5 Why Analysis, Fishbone Diagram, Fault Tree Analysis, Investigation Report, Root Cause Analysis)
- Probable Cause (text)
- Root Cause (text)
- Immediate Actions (multiline text, one per line)
- Findings (text)
- Conclusion (text)

**Backend (`DeviationService.submitInvestigation()`):**
1. INSERT into `deviation_investigations` (investigatorId, startDate, probableCause, rootCause, findings, conclusion, method)
2. INSERT immediate actions into `deviation_immediate_actions`
3. Complete Flowable `investigation` task
4. Flowable creates `impactAssessment` user task (candidateGroups: QA_REVIEWER, QA_APPROVER)
5. Update status to IMPACT_ASSESSMENT
6. Record workflow steps: "Investigation" = COMPLETED, "Impact Assessment" = CURRENT
7. Record audit trail: INVESTIGATION_SUBMITTED

**Overdue Escalation:**
- If investigation exceeds 25 days (P25D boundary timer), Flowable triggers `escalateOverdue` service task
- `escalationDelegate` sends INVESTIGATION_OVERDUE escalation notification
- This is non-interrupting; the investigation task remains active

---

### Step 4: Impact Assessment (Status: IMPACT_ASSESSMENT)

**Who:** QA Reviewer or QA Approver (candidateGroups: QA_REVIEWER, QA_APPROVER)

**How they see it:**
1. Task appears in Task Inbox as a candidate group task
2. User must claim the task first: `POST /api/v1/tasks/{taskId}/claim`
3. After claiming, task is assigned to them exclusively

**UI - Impact Assessment Form (inline in detail component):**
- Product Quality Impact: NONE/LOW/MEDIUM/HIGH
- Patient Safety Impact: NONE/LOW/MEDIUM/HIGH
- Regulatory Impact: NONE/LOW/MEDIUM/HIGH
- Business Impact: NONE/LOW/MEDIUM/HIGH
- Overall Risk Level: LOW/MEDIUM/HIGH/CRITICAL
- Batch Disposition (text)
- Affected Products (multiline)
- Affected Batches (multiline)
- Justification (text)

**Backend (`DeviationService.submitImpactAssessment()`):**
1. INSERT into `deviation_impact_assessments` (4 impact dimensions, overall risk, justification, etc.)
2. Complete Flowable `impactAssessment` task
3. Flowable creates `disposition` user task (candidateGroups: QA_APPROVER)
4. Update status to DISPOSITION
5. Record workflow steps: "Impact Assessment" = COMPLETED, "Disposition" = CURRENT
6. Record audit trail: IMPACT_ASSESSMENT_SUBMITTED

---

### Step 5: Disposition Decision (Status: DISPOSITION)

**Who:** QA Approver (QA_APPROVER role)

**How they see it:**
1. QA Approver sees `disposition` task in Task Inbox
2. Must claim task before acting
3. Reviews all prior investigation and impact data

**UI - Disposition Form (inline in detail component):**
- Decision: USE_AS_IS / RELEASE / RELEASE_WITH_CONDITIONS / REJECT / QUARANTINE / REPROCESS / REWORK / RETURN_TO_SUPPLIER
- CAPA Required: Yes/No
- Justification (text)
- Conditions (text, for conditional release)
- QA Review Comments (text)

**Actions available:**
- "Approve Disposition" (requires e-signature) -> moves to PENDING_CLOSURE (if no CAPA) or depends on CAPA gateway
- "Initiate CAPA" -> moves to CAPA_INITIATED
- "Reject" -> moves to REJECTED

**Backend (`DeviationService.submitDisposition()`):**
1. Validates user has QA_APPROVER role
2. INSERT into `deviation_dispositions` (decision, justification, conditions, qaReviewComments)
3. Set capaRequired flag on deviation
4. Complete Flowable `disposition` task with variable: `capaRequired = true/false`
5. Flowable reaches `capaGateway` exclusive gateway:
   - If `capaRequired == true` -> creates `capaInitiation` user task
   - If `capaRequired == false` -> creates `pendingClosure` user task
6. Update status accordingly
7. Record workflow steps and audit trail

---

### Step 5a: CAPA Initiation (Status: CAPA_INITIATED) - Conditional

**Who:** QA Reviewer or Deviation Owner (candidateGroups: QA_REVIEWER, OWNER)

**When:** Only if CAPA was determined as required during disposition

**Actions:**
1. User creates a CAPA record linked to this deviation
2. The CAPA record references the deviation ID
3. The deviation's `capaId` is updated with the new CAPA ID

**Backend (`DeviationService.transitionStatus()` for CAPA_INITIATED):**
1. Update deviation status to CAPA_INITIATED
2. Complete Flowable `capaInitiation` task
3. Flowable creates `pendingClosure` user task (candidateGroups: QA_APPROVER)
4. Record workflow steps: "CAPA Initiation" = COMPLETED, "Pending Closure" = CURRENT

---

### Step 6: Final QA Review & Closure (Status: PENDING_CLOSURE -> CLOSED)

**Who:** QA Approver (QA_APPROVER role)

**Actions:** "Close Deviation" button (requires e-signature via `ESignatureDialogComponent`)

**E-Signature Dialog:**
- Record Number displayed
- Action being signed
- Meaning/Statement of signature
- Password confirmation
- Compliance with 21 CFR Part 11

**Backend (`DeviationService.transitionStatus()` for CLOSED):**
1. `validateClosureRules()` checks:
   - Investigation must exist (deviation_investigations record)
   - Impact assessment must exist (deviation_impact_assessments record)
   - Disposition must exist (deviation_dispositions record)
   - If capaRequired = true, a CAPA must be linked (capaId not null)
2. Set `actualClosureDate = now()`
3. Complete Flowable `pendingClosure` task
4. Flowable executes `notifyClosed` service task:
   - Sends STATUS_CHANGE notification to `reportedById` (original reporter)
   - Title: "Deviation Closed: DEV-2026-001"
   - Message: "Deviation DEV-2026-001 has been closed"
5. Flowable process reaches end event
6. Update status to CLOSED
7. Record workflow steps: "Pending Closure" = COMPLETED, "Closed" = COMPLETED
8. Record audit trail: STATUS_CHANGED -> CLOSED

---

## 8. Notifications

Notifications are sent via `NotificationService` (in-app) and triggered by Flowable service tasks using `notificationDelegate` and `escalationDelegate`.

| Trigger | Type | Recipient | Title Template | When |
|---------|------|-----------|---------------|------|
| Investigation Assigned | `TASK_ASSIGNED` | assignedToId | "Investigation Assigned: {deviationNumber}" | After QA Review classification |
| Deviation Closed | `STATUS_CHANGE` | reportedById | "Deviation Closed: {deviationNumber}" | After final closure |
| Investigation Overdue | `ESCALATION` | (escalation rules) | "Investigation Overdue: {deviationNumber}" | After 25 days on investigation task |

### Notification Flow
1. Flowable service task fires with `notificationDelegate` or `escalationDelegate`
2. Delegate reads process variables (deviationNumber, recipientVariable)
3. Calls `NotificationService.send()` which INSERTs into `notifications` table
4. Frontend polls `GET /api/v1/notifications/unread-count` for badge display
5. User views notifications via `GET /api/v1/notifications`
6. Mark as read via `PATCH /api/v1/notifications/{id}/read`

---

## 9. Task Inbox Integration

### How Tasks Appear

The `TaskInboxService` queries Flowable `TaskService` for:
1. **Assigned tasks:** Tasks where the user is the direct assignee (e.g., `investigation` task assigned to specific investigator)
2. **Candidate group tasks:** Tasks where the user's role matches a candidate group (e.g., `qaReview` with candidateGroups=QA_REVIEWER)

### Task Response Fields

Each task in the inbox includes:
- `taskId` - Flowable task ID
- `taskName` - e.g., "QA Review & Classification", "Root Cause Investigation"
- `recordType` - "DEVIATION"
- `recordId` - UUID of the deviation
- `recordNumber` - e.g., "DEV-2026-001" (from process variable `deviationNumber`)
- `assignee` - User assigned to the task
- `createTime` - When the task was created
- `dueDate` - Task due date (if set)
- `formKey` - e.g., "deviation-classify", "deviation-investigate"
- `priority` - Task priority

### Process-to-RecordType Mapping

In `TaskInboxService`:
```
"deviationProcess" -> RecordType.DEVIATION
"capaProcess" -> RecordType.CAPA
"changeControlProcess" -> RecordType.CHANGE_CONTROL
```

---

## 10. Frontend UI Components

### 10.1 Deviation Form (`deviation-form.component.ts`)

- **Route:** `/deviations/new` (create) or `/deviations/edit/:id` (edit)
- **3-step Material Stepper:**
  1. Event Details (title, description, type, category, classification, dates, source area)
  2. Location & Product (plant site, department, area, equipment, product, batch, assigned user, target date, impact flags)
  3. Review & Submit (summary with compliance notice)
- Loads reference data from API: plant sites, departments, users
- Supports both create and edit modes

### 10.2 Deviation Detail (`deviation-detail.component.ts`)

- **Route:** `/deviations/detail/:id`
- **Layout:** mlabs Vault-inspired with:
  - **Record Header:** Deviation number, status pill (color-coded), impact badges, navigation arrows
  - **Lifecycle Bar:** Visual workflow progress (Reported -> QA Review -> Investigation -> Impact Assessment -> Disposition -> CAPA Initiation -> Pending Closure -> Closed)
  - **Workflow Actions Bar:** Dynamic action buttons based on status and user role
  - **Sidebar Navigation:** General, Timeline, Product, Investigation, Root Cause, Impact, Disposition, Attachments, Audit Trail
  - **Content Area:** Expandable/collapsible sections

**Key UI Sections:**
| Section | Content |
|---------|---------|
| General | Classification, type, category, source area, department, plant site |
| Impact Flags | GMP Impact, Patient Safety, Regulatory, CAPA Required badges |
| Timeline | Occurred/Reported/Detected dates, target/actual closure dates, assigned user |
| Product | Product, batch number, batch size, equipment, area |
| Investigation | Inline form to submit investigation (method, causes, actions, findings) |
| Root Cause | View investigation results |
| Impact Assessment | Inline form for 4-dimension impact rating |
| Disposition | Inline form for disposition decision with CAPA required flag |
| Attachments | Drag-and-drop upload with category and description |
| Audit Trail | Timestamped log of all changes with user, field, old/new values |

### 10.3 Deviation Service (`deviation.service.ts`)

**Angular service methods:**
- `getDeviations(filter?)` - List with filtering
- `getDeviationById(id)` - Get with workflow history, attachments, and audit trail
- `createDeviation(data)` - POST to create
- `updateDeviation(id, data)` - PUT to update
- `updateDeviationStatus(id, status, comments?)` - PATCH status
- `submitInvestigation(id, data)` - POST investigation
- `submitImpactAssessment(id, data)` - POST impact assessment
- `submitDisposition(id, data)` - POST disposition
- `getWorkflowHistory(id)` - GET workflow steps
- `getAuditTrail(id)` - GET audit entries
- `getAttachments(id)` - GET attachments
- `uploadAttachment(id, file, category?, description?)` - POST attachment
- `deleteAttachment(attachmentId)` - DELETE attachment
- `getDashboardMetrics()` - GET dashboard statistics

**Workflow Template (used for lifecycle bar):**
```typescript
const DEVIATION_WORKFLOW_TEMPLATE = [
  'Reported',
  'QA Review & Classification',
  'Investigation',
  'Impact Assessment',
  'Disposition',
  'CAPA Initiation',
  'Pending Closure',
  'Closed',
];
```

### 10.4 E-Signature Dialog

Used for regulated actions (Approve Disposition, Close Deviation):
- Opens modal dialog with record number and action description
- User confirms meaning/statement
- Password verification
- Returns `{ signed: true, meaning: string }` on success
- Compliant with 21 CFR Part 11 electronic signature requirements

---

## 11. Audit Trail

Every significant action records an audit trail entry in the `audit_trail` table:

| Action | When | Fields Tracked |
|--------|------|---------------|
| CREATED | Deviation first created | All initial values |
| STATUS_CHANGED | Any status transition | status (old -> new) |
| CLASSIFICATION_SET | QA Reviewer classifies | classification |
| INVESTIGATOR_ASSIGNED | Investigator assigned | assignedToId |
| INVESTIGATION_SUBMITTED | Investigation data saved | - |
| IMPACT_ASSESSMENT_SUBMITTED | Impact assessment saved | - |
| DISPOSITION_SUBMITTED | Disposition decision saved | decision, capaRequired |
| FIELD_CHANGED | Any field update | fieldName, oldValue, newValue |

### Dual Tracking

The system maintains **two parallel tracking mechanisms**:
1. **Workflow History** (`workflow_history` table) - Tracks BPMN process steps with status (COMPLETED/CURRENT/PENDING)
2. **Audit Trail** (`audit_trail` table) - Tracks individual field-level changes with timestamps and user info

---

## 12. Closure Validation Rules

Before a deviation can be closed (`validateClosureRules()`), the system verifies:

| Rule | Validation | Error Message |
|------|-----------|---------------|
| Investigation completed | `deviation_investigations` record must exist for this deviation | "Investigation must be completed before closure" |
| Impact assessment completed | `deviation_impact_assessments` record must exist | "Impact assessment must be completed before closure" |
| Disposition recorded | `deviation_dispositions` record must exist | "Disposition must be recorded before closure" |
| CAPA linked (if required) | If `capaRequired = true`, then `capaId` must not be null | "CAPA must be linked before closure when CAPA is required" |

These rules ensure regulatory compliance and prevent premature closure of deviation records.
