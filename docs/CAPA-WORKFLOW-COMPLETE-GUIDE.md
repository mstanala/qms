# CAPA Workflow - Complete Technical & Functional Guide

## Table of Contents
1. [Overview](#1-overview)
2. [CAPA Statuses & Lifecycle](#2-capa-statuses--lifecycle)
3. [Roles & Permissions](#3-roles--permissions)
4. [Flowable BPMN Workflow Engine](#4-flowable-bpmn-workflow-engine)
5. [Step-by-Step Workflow Walkthrough](#5-step-by-step-workflow-walkthrough)
6. [Backend API Reference](#6-backend-api-reference)
7. [Frontend UI Components](#7-frontend-ui-components)
8. [Database Schema (DDL)](#8-database-schema-ddl)
9. [Notifications](#9-notifications)
10. [Task Inbox](#10-task-inbox)
11. [Audit Trail](#11-audit-trail)
12. [Complete Scenario: End-to-End CAPA Lifecycle](#12-complete-scenario-end-to-end-capa-lifecycle)

---

## 1. Overview

CAPA (Corrective and Preventive Actions) is the most critical module in the QMS-Pharma platform. It manages the lifecycle of quality actions triggered by deviations, audit findings, complaints, or other quality events.

### Architecture
```
Angular MFE (capa-mfe)  -->  Spring Boot REST APIs  -->  PostgreSQL
                                     |
                              Flowable BPMN Engine
                                     |
                              Notification System
```

### Key Files
| Layer | File | Purpose |
|-------|------|---------|
| BPMN | `backend/src/main/resources/processes/capa-process.bpmn20.xml` | Flowable process definition |
| Service | `backend/.../service/CapaService.java` | Core business logic |
| Controller | `backend/.../controller/CapaController.java` | REST endpoints |
| Entity | `backend/.../model/entity/Capa.java` | JPA entity |
| DDL | `backend/.../db/migration/V1__create_schema.sql` | Database tables |
| UI Service | `capa-mfe/src/app/capa/services/capa.service.ts` | Angular HTTP client |
| UI Detail | `capa-mfe/src/app/capa/components/capa-detail/capa-detail.component.ts` | Detail screen with tabs |
| UI Form | `capa-mfe/src/app/capa/components/capa-form/capa-form.component.ts` | CAPA creation wizard |

---

## 2. CAPA Statuses & Lifecycle

### Status Flow Diagram
```
INITIATED
    |
    v
UNDER_REVIEW  -----(rejected)----->  REJECTED (end)
    |
    (approved)
    |
    v
INVESTIGATION
    |
    v
ROOT_CAUSE_IDENTIFIED
    |
    v
ACTION_PLANNING
    |
    v
ACTION_IN_PROGRESS
    |
    v
EFFECTIVENESS_CHECK
    |  |
    |  (not effective) --> back to ACTION_PLANNING
    |
    (effective)
    |
    v
PENDING_CLOSURE
    |
    v
CLOSED (end)
```

### Status Definitions
| Status | Description | Who Acts |
|--------|-------------|----------|
| `INITIATED` | CAPA record created, awaiting QA review | Quality Engineer (creator) |
| `UNDER_REVIEW` | QA reviewing CAPA initiation, scope, source | QA Reviewer |
| `INVESTIGATION` | Root cause analysis in progress | CAPA Owner |
| `ROOT_CAUSE_IDENTIFIED` | RCA complete, risk assessment done | CAPA Owner |
| `ACTION_PLANNING` | Defining corrective/preventive actions | CAPA Owner |
| `ACTION_IN_PROGRESS` | Actions being executed by assignees | Action Assignees |
| `EFFECTIVENESS_CHECK` | Verifying actions were effective | QA Reviewer/Approver |
| `PENDING_CLOSURE` | Final QA approval for closure | QA Approver |
| `CLOSED` | CAPA complete | - |
| `REJECTED` | CAPA rejected during QA review | - |

---

## 3. Roles & Permissions

### Application Roles (from `V2__seed_data.sql`)
| Role | Code | CAPA Permissions |
|------|------|-----------------|
| **End User** | `END_USER` | CREATE, READ, UPDATE |
| **Owner** | `OWNER` | CREATE, READ, UPDATE, ASSIGN, DELETE |
| **Reviewer** | `REVIEWER` | READ |
| **Approver** | `APPROVER` | APPROVE, REJECT, READ |
| **QA Reviewer** | `QA_REVIEWER` | READ, EXPORT, ASSIGN |
| **QA Approver** | `QA_APPROVER` | APPROVE, REJECT, CLOSE, REOPEN, READ, EXPORT |
| **System Admin** | `VAULT_ADMIN` | All permissions |

### Security Profiles
| Profile | CAPA Access |
|---------|------------|
| **Quality Manager** | All non-admin CAPA permissions |
| **QA Specialist** | READ, ASSIGN, EXPORT + APPROVE/REJECT for CAPA |
| **CAPA Coordinator** | All CAPA permissions + READ deviations/reports |
| **Investigator** | READ all + UPDATE CAPA |

### CAPA Permissions (from `V2__seed_data.sql`)
```sql
('CAPA', 'CREATE',  'capa_record', 'Create new CAPA records')
('CAPA', 'READ',    'capa_record', 'View CAPA records')
('CAPA', 'UPDATE',  'capa_record', 'Edit CAPA records')
('CAPA', 'DELETE',  'capa_record', 'Delete draft CAPA records')
('CAPA', 'APPROVE', 'capa_record', 'Approve CAPA records')
('CAPA', 'REJECT',  'capa_record', 'Reject CAPA records')
('CAPA', 'CLOSE',   'capa_record', 'Close CAPA records')
('CAPA', 'REOPEN',  'capa_record', 'Reopen closed CAPA records')
('CAPA', 'ASSIGN',  'capa_record', 'Assign CAPA owner/investigator')
('CAPA', 'EXPORT',  'capa_report', 'Export CAPA data and reports')
```

---

## 4. Flowable BPMN Workflow Engine

### Process Definition: `capaProcess`
File: `backend/src/main/resources/processes/capa-process.bpmn20.xml`

### Process Variables (set at start)
| Variable | Source | Description |
|----------|--------|-------------|
| `recordId` | CAPA UUID | Links process to CAPA record |
| `capaNumber` | Generated | e.g., `CAPA-2026-001` |
| `initiatorId` | Current user UUID | Person who created the CAPA |
| `ownerId` | Selected owner UUID | Person responsible for the CAPA |
| `priority` | Form field | CRITICAL/HIGH/MEDIUM/LOW |
| `plantSiteId` | Form field | Plant site UUID |
| `departmentId` | Form field | Department UUID |
| `targetCompletionDate` | Form field | Due date for actions |

### BPMN Tasks & Assignments

```
Start Event
    |
    v
[qaReview] - User Task
    Candidate Groups: QA_REVIEWER
    Form Key: capa-review
    Output: reviewDecision (APPROVED/REJECTED)
    |
    v
<reviewGateway> - Exclusive Gateway
    |                    |
    APPROVED          REJECTED
    |                    |
    v                    v
[investigation]     [rejectedEnd]
    Assignee: ${ownerId}
    Form Key: capa-rca
    Due Date: ${targetCompletionDate}
    |
    v
[riskAssessment] - User Task
    Assignee: ${ownerId}
    Form Key: capa-risk
    |
    v
[actionPlanning] - User Task  <----+
    Assignee: ${ownerId}           |
    Form Key: capa-actions         |
    |                              |
    v                              |
[actionExecution] - User Task      |
    Assignee: ${ownerId}           |
    Form Key: capa-execute         |
    Timer: R3/P7D (reminder)       |
    |                              |
    v                              |
[effectivenessCheck] - User Task   |
    Candidate Groups:              |
      QA_REVIEWER, QA_APPROVER     |
    Form Key: capa-effectiveness   |
    Output: effectivenessResult    |
    |                              |
    v                              |
<effectivenessGateway>             |
    |              |               |
    EFFECTIVE    NOT_EFFECTIVE -----+
    |
    v
[qaApproval] - User Task
    Candidate Groups: QA_APPROVER
    Form Key: capa-approve
    |
    v
[notifyClosed] - Service Task
    Delegate: notificationDelegate
    Sends: STATUS_CHANGE notification
    To: initiatorId
    Title: "CAPA Closed: {capaNumber}"
    |
    v
End Event
```

### Timer Event: Action Overdue Reminder
```xml
<boundaryEvent id="actionTimer" attachedToRef="actionExecution" cancelActivity="false">
    <timerEventDefinition>
        <timeCycle>R3/P7D</timeCycle>  <!-- Repeats 3 times, every 7 days -->
    </timerEventDefinition>
</boundaryEvent>
```
This triggers the `reminderDelegate` service task which sends overdue reminders to the CAPA owner every 7 days during action execution, up to 3 times.

---

## 5. Step-by-Step Workflow Walkthrough

### Step 1: CAPA Initiation
**Who:** Quality Engineer / End User (needs `CAPA.CREATE`)

**UI:** Navigate to CAPA > Create New CAPA (`/capa/create`)

**Form (3-step wizard):**
1. **Event Information:** Title, Description, Type (Corrective/Preventive/Both), Priority, Source Type, Source Reference
2. **Assignment:** Owner, Plant Site, Department, Target Completion Date, Product, Batch Number
3. **Review:** Summary of all fields before submission

**API Call:**
```
POST /api/v1/capas
Body: { title, description, type, priority, sourceType, sourceReference,
        ownerName, departmentId, plantSiteId, targetCompletionDate, ... }
```

**Backend (CapaService.create):**
1. Generates CAPA number (e.g., `CAPA-2026-001`)
2. Creates CAPA entity with status `INITIATED`
3. Starts Flowable process: `capaProcess` with variables
4. Records workflow history step: "Initiation" (COMPLETED)
5. Records workflow history step: "QA Review" (CURRENT)
6. Logs audit trail entry

**Flowable:** Process starts, first user task `qaReview` becomes active, assigned to candidate group `QA_REVIEWER`.

---

### Step 2: QA Review
**Who:** QA Reviewer (role: `QA_REVIEWER`)

**How they know:** The `qaReview` task appears in their Task Inbox (`/api/v1/tasks/inbox`). They can also see the CAPA in the list with status `UNDER_REVIEW`.

**UI:** Open CAPA detail screen > Click status transition button

**API Call:**
```
PATCH /api/v1/capas/{id}/status
Body: { status: "UNDER_REVIEW" }  --> then { status: "INVESTIGATION" } to approve
                              or  --> { status: "REJECTED" } to reject
```

**Backend (CapaService.transitionStatus):**
- Transition to `UNDER_REVIEW`: Completes Flowable task `qaReview` with `reviewDecision=APPROVED`
- Records workflow steps and audit trail
- Flowable advances to `investigation` task, assigned to `${ownerId}`

**If Rejected:**
- Completes `qaReview` with `reviewDecision=REJECTED`
- CAPA status set to `REJECTED`
- Flowable process ends at `rejectedEnd`

---

### Step 3: Investigation / Root Cause Analysis
**Who:** CAPA Owner (the `ownerId` assigned during creation)

**How they know:** The `investigation` task is in their Task Inbox. CAPA status shows `INVESTIGATION`.

**UI:** CAPA Detail > Root Cause tab > Submit Root Cause Analysis

**API Call:**
```
POST /api/v1/capas/{id}/root-cause-analysis
Body: {
  method: "FIVE_WHY" | "FISHBONE" | "FAULT_TREE" | "PARETO" | "FAILURE_MODE",
  description: "...",
  rootCauses: ["cause 1", "cause 2"],
  contributingFactors: ["factor 1"],
  fiveWhyEntries: [{ level: 1, question: "...", answer: "..." }, ...],
  fishboneCategories: [{ categoryName: "Man", causes: ["..."] }, ...]
}
```

**Backend:** Creates `CapaRootCauseAnalysis` entity with related `CapaFiveWhyEntry` or `CapaFishboneCategory` records. Transitions status to `ROOT_CAUSE_IDENTIFIED`. Completes Flowable task `investigation`.

---

### Step 4: Risk Assessment
**Who:** CAPA Owner

**UI:** CAPA Detail > Risk Assessment section

**API Call:**
```
POST /api/v1/capas/{id}/risk-assessment
Body: {
  severity: 4,       // 1-5
  occurrence: 3,     // 1-5
  detection: 2,      // 1-5
  riskLevel: "HIGH", // LOW/MEDIUM/HIGH/CRITICAL
  justification: "..."
}
```

**Backend:** Creates `CapaRiskAssessment` entity. RPN (Risk Priority Number) is auto-calculated: `severity * occurrence * detection`. Completes Flowable task `riskAssessment`. Status transitions to `ACTION_PLANNING`.

---

### Step 5: Action Planning
**Who:** CAPA Owner

**UI:** CAPA Detail > Actions tab > Click "Add Corrective Action" or "Add Preventive Action"

**API Call (add actions):**
```
POST /api/v1/capas/{id}/actions
Body: {
  description: "...",
  type: "CORRECTIVE" | "PREVENTIVE",
  assignedToId: "user-uuid",
  dueDate: "2026-07-15T00:00:00Z"
}
```

**API Call (start execution - move to next phase):**
```
POST /api/v1/capas/{id}/start-action-execution
```

**Backend:** Creates `CapaAction` entities with auto-generated action numbers. When execution starts, completes Flowable task `actionPlanning`. Status transitions to `ACTION_IN_PROGRESS`.

---

### Step 6: Action Execution & Verification
**Who:** Action Assignees (complete their actions), CAPA Owner (monitors & verifies)

**UI:** CAPA Detail > Actions tab

Action Assignees see their assigned actions and can:
- **Complete:** Click "Complete" button on their action
- **Verify:** Click "Verify" button (after action is completed, owner verifies)

**API Call (complete action):**
```
PATCH /api/v1/capas/{id}/actions/{actionId}
Body: { status: "COMPLETED", evidence: "...", completedDate: "..." }
```

**API Call (verify action):**
```
PATCH /api/v1/capas/{id}/actions/{actionId}
Body: { status: "VERIFIED", verificationComments: "..." }
```

**API Call (complete execution phase - all actions done):**
```
POST /api/v1/capas/{id}/complete-action-execution
```

**Backend:** Updates action statuses. When all actions are verified and execution is completed, completes Flowable task `actionExecution`. Status transitions to `EFFECTIVENESS_CHECK`.

**Timer:** During this phase, Flowable's boundary timer event fires every 7 days (up to 3 times) via `reminderDelegate`, sending overdue reminders to the CAPA owner.

---

### Step 7: Effectiveness Check
**Who:** QA Reviewer or QA Approver (Flowable candidate groups: `QA_REVIEWER`, `QA_APPROVER`)

**UI:** CAPA Detail > Effectiveness tab > Click "Submit Effectiveness Check"

**API Call:**
```
POST /api/v1/capas/{id}/effectiveness-checks
Body: {
  criteria: "No recurrence of issue for 60 days",
  checkDate: "2026-08-15T00:00:00Z",
  result: "EFFECTIVE" | "NOT_EFFECTIVE" | "PARTIALLY_EFFECTIVE",
  evidence: "...",
  comments: "...",
  requiresRecurrence: true,
  recurrenceMonths: 3
}
```

**Backend:** Creates `CapaEffectivenessCheck` entity. Completes Flowable task `effectivenessCheck` with `effectivenessResult` variable.

**Flowable Gateway Decision:**
- If `EFFECTIVE` --> advances to `qaApproval` task
- If `NOT_EFFECTIVE` or `PARTIALLY_EFFECTIVE` --> **loops back** to `actionPlanning` (CAPA owner must plan new actions)

---

### Step 8: QA Approval for Closure
**Who:** QA Approver (Flowable candidate group: `QA_APPROVER`)

**How they know:** `qaApproval` task in their Task Inbox.

**API Call:**
```
PATCH /api/v1/capas/{id}/status
Body: { status: "CLOSED" }
```

**Backend:** Completes Flowable task `qaApproval`. Flowable triggers `notifyClosed` service task.

---

### Step 9: Notification & Closure
**Automated by Flowable:**

The `notifyClosed` service task uses `NotificationDelegate`:
1. Sends notification to the **initiator** (person who created the CAPA)
2. Notification type: `STATUS_CHANGE`
3. Title: "CAPA Closed: CAPA-2026-001"
4. Message: "CAPA CAPA-2026-001 has been closed after effectiveness verification"

The notification is stored in the `notifications` table and appears in the user's notification center.

---

## 6. Backend API Reference

### Base URL: `/api/v1/capas`

| Method | Endpoint | Description | Required Permission |
|--------|----------|-------------|-------------------|
| `GET` | `/` | List CAPAs (paginated, filterable) | `CAPA.READ` |
| `POST` | `/` | Create new CAPA | `CAPA.CREATE` |
| `GET` | `/{id}` | Get CAPA detail with all sub-entities | `CAPA.READ` |
| `PUT` | `/{id}` | Update CAPA fields | `CAPA.UPDATE` |
| `PATCH` | `/{id}/status` | Transition CAPA status | Varies by transition |
| `POST` | `/{id}/root-cause-analysis` | Submit RCA | `CAPA.UPDATE` |
| `POST` | `/{id}/risk-assessment` | Submit risk assessment | `CAPA.UPDATE` |
| `POST` | `/{id}/actions` | Add corrective/preventive action | `CAPA.UPDATE` |
| `PATCH` | `/{id}/actions/{actionId}` | Update action status | `CAPA.UPDATE` |
| `POST` | `/{id}/effectiveness-checks` | Submit effectiveness check | `CAPA.APPROVE` |
| `POST` | `/{id}/start-action-execution` | Move to execution phase | `CAPA.UPDATE` |
| `POST` | `/{id}/complete-action-execution` | Complete execution phase | `CAPA.UPDATE` |
| `GET` | `/{id}/workflow-history` | Get workflow history steps | `CAPA.READ` |
| `GET` | `/dashboard` | Dashboard metrics | `CAPA.READ` |

### Task Inbox APIs: `/api/v1/tasks`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/inbox` | Get all tasks for current user |
| `GET` | `/inbox/count` | Get task count (for badge) |
| `GET` | `/by-record-type/{type}` | Filter tasks by CAPA/DEVIATION/etc |
| `POST` | `/{taskId}/claim` | Claim a candidate group task |
| `POST` | `/{taskId}/unclaim` | Release a claimed task |

---

## 7. Frontend UI Components

### Routes (`capa-mfe/src/app/capa/capa.routes.ts`)
| Path | Component | Description |
|------|-----------|-------------|
| `/capa` | redirect | Redirects to `/capa/dashboard` |
| `/capa/dashboard` | `CapaDashboardComponent` | Metrics & charts |
| `/capa/list` | `CapaListComponent` | Filterable CAPA table |
| `/capa/create` | `CapaFormComponent` | 3-step creation wizard |
| `/capa/:id` | `CapaDetailComponent` | Detail view with tabs |

### CAPA Detail Tabs & Actions

| Tab | Content | Status-Based Buttons |
|-----|---------|---------------------|
| **Overview** | Basic info, status, dates | Status transition buttons |
| **Root Cause** | RCA method, five-whys, fishbone | Submit RCA (during `INVESTIGATION`) |
| **Risk Assessment** | Severity/Occurrence/Detection matrix | Submit (during `ROOT_CAUSE_IDENTIFIED`) |
| **Actions** | Corrective & preventive action list | Add Action (`ACTION_PLANNING`), Complete/Verify (`ACTION_IN_PROGRESS`) |
| **Effectiveness** | Check results and evidence | Submit Check (`EFFECTIVENESS_CHECK`) |
| **Workflow** | Step history timeline | Read-only |
| **Audit Trail** | Timestamped change log | Read-only |

### Dialog Components
| Component | Triggered From | Purpose |
|-----------|---------------|---------|
| `CapaActionDialogComponent` | Actions tab "Add" button | Add corrective/preventive action with assignee & due date |
| `CapaEffectivenessDialogComponent` | Effectiveness tab "Submit" button | Submit effectiveness check with criteria, result, evidence |

---

## 8. Database Schema (DDL)

### Core Tables

#### `capas` - Main CAPA record
```sql
CREATE TABLE capas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_number             VARCHAR(50) NOT NULL UNIQUE,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    type                    VARCHAR(30) NOT NULL,          -- CORRECTIVE/PREVENTIVE/CORRECTIVE_AND_PREVENTIVE
    status                  VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
    priority                VARCHAR(20) NOT NULL,          -- CRITICAL/HIGH/MEDIUM/LOW
    source_type             VARCHAR(30) NOT NULL,          -- DEVIATION/AUDIT_FINDING/COMPLAINT/etc.
    source_reference        VARCHAR(255),
    initiated_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    target_completion_date  TIMESTAMPTZ NOT NULL,
    actual_completion_date  TIMESTAMPTZ,
    due_date                TIMESTAMPTZ NOT NULL,
    initiator_id            UUID NOT NULL REFERENCES users(id),
    owner_id                UUID NOT NULL REFERENCES users(id),
    department_id           UUID NOT NULL REFERENCES departments(id),
    plant_site_id           UUID NOT NULL REFERENCES plant_sites(id),
    product                 VARCHAR(255),
    batch_number            VARCHAR(100),
    deviation_id            UUID REFERENCES deviations(id),
    current_workflow_step   VARCHAR(100) NOT NULL DEFAULT 'Initiation',
    flowable_process_id     VARCHAR(255),
    closed_at               TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              UUID NOT NULL REFERENCES users(id),
    updated_by              UUID NOT NULL REFERENCES users(id),
    version                 INTEGER NOT NULL DEFAULT 1
);
```

#### `capa_root_cause_analyses` - RCA records (one per CAPA)
```sql
CREATE TABLE capa_root_cause_analyses (
    id                      UUID PRIMARY KEY,
    capa_id                 UUID NOT NULL UNIQUE REFERENCES capas(id),
    method                  VARCHAR(30) NOT NULL,  -- FIVE_WHY/FISHBONE/FAULT_TREE/PARETO/FAILURE_MODE
    description             TEXT NOT NULL,
    root_causes             TEXT[] NOT NULL DEFAULT '{}',
    contributing_factors    TEXT[] DEFAULT '{}',
    fishbone_diagram_url    VARCHAR(1000),
    completed_date          TIMESTAMPTZ,
    completed_by_id         UUID REFERENCES users(id)
);
```

#### `capa_five_why_entries` - Five-Why analysis steps
```sql
CREATE TABLE capa_five_why_entries (
    id          UUID PRIMARY KEY,
    rca_id      UUID NOT NULL REFERENCES capa_root_cause_analyses(id),
    level       INTEGER NOT NULL CHECK (level >= 1 AND level <= 7),
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    UNIQUE (rca_id, level)
);
```

#### `capa_fishbone_categories` - Ishikawa diagram categories
```sql
CREATE TABLE capa_fishbone_categories (
    id              UUID PRIMARY KEY,
    rca_id          UUID NOT NULL REFERENCES capa_root_cause_analyses(id),
    category_name   VARCHAR(100) NOT NULL,
    causes          TEXT[] NOT NULL DEFAULT '{}'
);
```

#### `capa_risk_assessments` - Risk evaluation (one per CAPA)
```sql
CREATE TABLE capa_risk_assessments (
    id              UUID PRIMARY KEY,
    capa_id         UUID NOT NULL UNIQUE REFERENCES capas(id),
    severity        INTEGER NOT NULL CHECK (1-5),
    occurrence      INTEGER NOT NULL CHECK (1-5),
    detection       INTEGER NOT NULL CHECK (1-5),
    rpn             INTEGER GENERATED ALWAYS AS (severity * occurrence * detection) STORED,
    risk_level      VARCHAR(20) NOT NULL,  -- LOW/MEDIUM/HIGH/CRITICAL
    justification   TEXT NOT NULL,
    assessed_by_id  UUID REFERENCES users(id),
    assessed_date   TIMESTAMPTZ
);
```

#### `capa_actions` - Corrective & preventive actions
```sql
CREATE TABLE capa_actions (
    id                      UUID PRIMARY KEY,
    capa_id                 UUID NOT NULL REFERENCES capas(id),
    action_number           VARCHAR(50) NOT NULL UNIQUE per CAPA,
    description             TEXT NOT NULL,
    type                    VARCHAR(20) NOT NULL,   -- CORRECTIVE/PREVENTIVE
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING/IN_PROGRESS/COMPLETED/VERIFIED/OVERDUE
    assigned_to_id          UUID NOT NULL REFERENCES users(id),
    due_date                TIMESTAMPTZ NOT NULL,
    completed_date          TIMESTAMPTZ,
    evidence                TEXT,
    evidence_url            VARCHAR(1000),
    verified_by_id          UUID REFERENCES users(id),
    verified_date           TIMESTAMPTZ,
    verification_comments   TEXT
);
```

#### `capa_effectiveness_checks` - Effectiveness verification
```sql
CREATE TABLE capa_effectiveness_checks (
    id                      UUID PRIMARY KEY,
    capa_id                 UUID NOT NULL REFERENCES capas(id),
    criteria                TEXT NOT NULL,
    check_date              TIMESTAMPTZ NOT NULL,
    result                  VARCHAR(30) NOT NULL,  -- EFFECTIVE/NOT_EFFECTIVE/PARTIALLY_EFFECTIVE
    evidence                TEXT NOT NULL,
    verified_by_id          UUID NOT NULL REFERENCES users(id),
    comments                TEXT,
    requires_recurrence     BOOLEAN DEFAULT FALSE,
    recurrence_months       INTEGER,
    next_check_date         TIMESTAMPTZ,
    check_number            INTEGER NOT NULL DEFAULT 1
);
```

### Supporting Tables
| Table | Purpose |
|-------|---------|
| `workflow_history` | Dual-tracked workflow steps (alongside Flowable) |
| `audit_trails` | 21 CFR Part 11 compliant change log |
| `notifications` | In-app notification records |
| `sequence_generators` | Auto-numbering (CAPA-2026-001, etc.) |

---

## 9. Notifications

### How Notifications Work

#### Flowable-Triggered Notifications
The BPMN process uses `notificationDelegate` (a Flowable `JavaDelegate`) to send notifications at key workflow points:

```java
@Component("notificationDelegate")
public class NotificationDelegate implements JavaDelegate {
    // Reads from process variables:
    // - recipientVariable: which variable holds the recipient user ID
    // - titleTemplate: notification title with {capaNumber} placeholders
    // - messageTemplate: notification body
    // - notificationType: STATUS_CHANGE, TASK_ASSIGNED, etc.
}
```

**Currently Configured Notifications in BPMN:**
| Trigger | Recipient | Type | Message |
|---------|-----------|------|---------|
| CAPA Closed | Initiator | STATUS_CHANGE | "CAPA {capaNumber} has been closed after effectiveness verification" |
| Action Overdue | Owner | REMINDER | Overdue reminder (every 7 days, 3 times) |

#### Notification Types
```java
enum NotificationType {
    TASK_ASSIGNED,      // New task assigned to user
    APPROVAL_REQUIRED,  // Approval action needed
    OVERDUE_ALERT,      // Past due date
    STATUS_CHANGE,      // Record status changed
    ESCALATION,         // Escalated item
    SYSTEM,             // System notification
    REMINDER            // Periodic reminder
}
```

#### Notification Storage
```sql
-- Notifications are stored in the notifications table
-- Users can view via:
GET /api/v1/notifications          -- List notifications
GET /api/v1/notifications/unread-count  -- Badge count
PATCH /api/v1/notifications/{id}/read   -- Mark as read
POST /api/v1/notifications/mark-all-read -- Mark all read
```

---

## 10. Task Inbox

### How Users Know What to Do

When a Flowable user task is created, it is assigned either to:
- **A specific user** via `flowable:assignee="${ownerId}"` (e.g., investigation, risk assessment, action planning)
- **A candidate group** via `flowable:candidateGroups="QA_REVIEWER"` (e.g., QA review, effectiveness check, QA approval)

#### Task Inbox API
```
GET /api/v1/tasks/inbox?candidateGroups=QA_REVIEWER,QA_APPROVER
```

Returns tasks like:
```json
{
  "taskId": "12345",
  "taskName": "QA Review",
  "taskDefinitionKey": "qaReview",
  "recordType": "CAPA",
  "recordId": "uuid-of-capa",
  "recordNumber": "CAPA-2026-001",
  "assignee": null,
  "formKey": "capa-review",
  "createTime": "2026-06-25T10:00:00Z"
}
```

#### Claim/Unclaim Flow
For candidate group tasks (like QA Review):
1. Task appears in inbox for ALL users with the `QA_REVIEWER` role
2. A user **claims** the task: `POST /api/v1/tasks/{taskId}/claim`
3. Task is now assigned to that user only
4. If needed, they can **unclaim**: `POST /api/v1/tasks/{taskId}/unclaim`

---

## 11. Audit Trail

### 21 CFR Part 11 Compliance
Every action on a CAPA is logged to the `audit_trails` table:

```java
auditTrailService.logAction(
    "CAPA",                    // recordType
    capa.getId(),              // recordId
    capa.getCapaNumber(),      // recordNumber
    "STATUS_CHANGE",           // action
    "status",                  // fieldName
    "INVESTIGATION",           // oldValue
    "ROOT_CAUSE_IDENTIFIED",   // newValue
    "Root cause analysis submitted"  // comments
);
```

**Captured metadata:**
- User ID and display name
- IP address (from HTTP request)
- User agent (browser info)
- Timestamp
- Old and new values
- Reason for change

---

## 12. Complete Scenario: End-to-End CAPA Lifecycle

### Scenario: Equipment Malfunction Causes Batch Deviation

#### Day 1: Quality Engineer Creates CAPA

**User:** Rajesh Kumar (Quality Engineer, role: `END_USER`)
**Action:** Navigates to CAPA > Create New CAPA

| Field | Value |
|-------|-------|
| Title | Compression machine force variance causing tablet weight deviation |
| Type | Corrective and Preventive |
| Priority | HIGH |
| Source | DEVIATION |
| Source Ref | DEV-2026-015 |
| Owner | Priya Sharma |
| Department | Production |
| Plant Site | Hyderabad Unit 1 |
| Target Date | 2026-08-01 |

**System Actions:**
1. CAPA number generated: `CAPA-2026-003`
2. Status: `INITIATED`
3. Flowable process `capaProcess` started
4. Task `qaReview` created for `QA_REVIEWER` group
5. Audit trail: "CAPA created"

---

#### Day 2: QA Reviewer Approves CAPA

**User:** Kavitha Krishnan (QA Specialist, role: `QA_REVIEWER`)
**How she knows:** Opens Task Inbox, sees "QA Review" task for CAPA-2026-003

**Action:** Reviews CAPA details, clicks "Approve" (transitions to `UNDER_REVIEW` then `INVESTIGATION`)

**System Actions:**
1. Flowable task `qaReview` completed with `reviewDecision=APPROVED`
2. Status: `INVESTIGATION`
3. Flowable task `investigation` created, assigned to Priya Sharma (ownerId)
4. Notification sent to Priya: "CAPA-2026-003 requires investigation"
5. Audit trail: "Status changed from INITIATED to INVESTIGATION"

---

#### Day 5: CAPA Owner Submits Root Cause Analysis

**User:** Priya Sharma (CAPA Owner, role: `OWNER`)
**How she knows:** Task `investigation` in her inbox

**Action:** Submits Five-Why analysis:
| Level | Why? | Answer |
|-------|------|--------|
| 1 | Why did tablets have weight variance? | Compression force inconsistent |
| 2 | Why was force inconsistent? | Force sensor calibration drifted |
| 3 | Why did calibration drift? | No preventive maintenance schedule |
| 4 | Why no PM schedule? | PM process only covered critical equipment |
| 5 | Why not classified critical? | Risk assessment outdated |

Root Causes: ["Force sensor calibration drift", "Inadequate PM classification"]

**System Actions:**
1. `CapaRootCauseAnalysis` + 5 `CapaFiveWhyEntry` records created
2. Status: `ROOT_CAUSE_IDENTIFIED`
3. Flowable task `investigation` completed
4. Flowable task `riskAssessment` created for Priya
5. Audit trail: "Root cause analysis submitted"

---

#### Day 6: CAPA Owner Submits Risk Assessment

**User:** Priya Sharma
**Action:** Submits risk scores:
| Factor | Score | Justification |
|--------|-------|--------------|
| Severity | 4 | Product quality directly affected |
| Occurrence | 3 | Has happened twice in 6 months |
| Detection | 2 | Caught by in-process checks |
| **RPN** | **24** | **HIGH risk** |

**System Actions:**
1. `CapaRiskAssessment` created, RPN auto-calculated
2. Status: `ACTION_PLANNING`
3. Flowable task `riskAssessment` completed
4. Flowable task `actionPlanning` created for Priya

---

#### Day 7-8: CAPA Owner Plans Actions

**User:** Priya Sharma
**Action:** Adds corrective and preventive actions:

| # | Type | Description | Assigned To | Due Date |
|---|------|-------------|------------|----------|
| CA-001 | Corrective | Recalibrate compression force sensors | Suresh Reddy | July 5 |
| CA-002 | Corrective | Rework affected batch per deviation SOP | Mohammad Ali | July 10 |
| PA-001 | Preventive | Add compression machines to PM schedule | Venkat Naidu | July 15 |
| PA-002 | Preventive | Update equipment risk classification SOP | Anitha Rao | July 20 |

Then clicks "Start Action Execution"

**System Actions:**
1. 4 `CapaAction` records created
2. Status: `ACTION_IN_PROGRESS`
3. Flowable task `actionPlanning` completed
4. Flowable task `actionExecution` created for Priya
5. Timer boundary event starts (7-day reminder cycle)

---

#### Day 10-25: Action Execution

**Users:** Individual action assignees complete their tasks:

- **Suresh** calibrates sensors, marks CA-001 as COMPLETED with evidence
- **Mohammad** completes batch rework, marks CA-002 as COMPLETED
- **Venkat** updates PM schedule, marks PA-001 as COMPLETED
- **Anitha** revises SOP, marks PA-002 as COMPLETED

**Priya (Owner)** verifies each completed action:
- Reviews evidence for each action
- Marks each as VERIFIED with verification comments

After all actions are verified, Priya clicks "Complete Action Execution"

**System Actions:**
1. All action statuses: VERIFIED
2. Status: `EFFECTIVENESS_CHECK`
3. Flowable task `actionExecution` completed
4. Flowable task `effectivenessCheck` created for `QA_REVIEWER` + `QA_APPROVER` groups

---

#### Day 55: Effectiveness Check (30 days after actions)

**User:** Kavitha Krishnan (QA Reviewer)
**Action:** Submits effectiveness check:

| Field | Value |
|-------|-------|
| Criteria | No recurrence of tablet weight variance for 30 days |
| Check Date | 2026-08-20 |
| Result | EFFECTIVE |
| Evidence | 12 batches manufactured since correction, all within spec. Force sensor readings stable. PM schedule executing on time. |
| Requires Recurrence | Yes - 3 month follow-up |

**System Actions:**
1. `CapaEffectivenessCheck` created
2. Flowable task `effectivenessCheck` completed with `effectivenessResult=EFFECTIVE`
3. Flowable gateway routes to `qaApproval`
4. Status: `PENDING_CLOSURE`
5. Flowable task `qaApproval` created for `QA_APPROVER` group

**If NOT_EFFECTIVE:** Flowable would loop back to `actionPlanning`, requiring Priya to plan new actions.

---

#### Day 56: QA Approval & Closure

**User:** Srinivas Rao (QA Head, role: `QA_APPROVER`)
**Action:** Reviews CAPA, approves closure

**System Actions:**
1. Flowable task `qaApproval` completed
2. Flowable `notifyClosed` service task fires:
   - Sends notification to Rajesh Kumar (initiator): "CAPA Closed: CAPA-2026-003"
3. Status: `CLOSED`
4. `closed_at` timestamp recorded
5. Flowable process ends
6. Final audit trail: "CAPA closed"

---

### Summary: Who Does What

| Step | Status | Actor | Role | Flowable Task | Action |
|------|--------|-------|------|---------------|--------|
| 1 | INITIATED | Quality Engineer | END_USER | (start) | Create CAPA |
| 2 | UNDER_REVIEW | QA Reviewer | QA_REVIEWER | qaReview | Approve/Reject |
| 3 | INVESTIGATION | CAPA Owner | OWNER | investigation | Submit RCA |
| 4 | ROOT_CAUSE_IDENTIFIED | CAPA Owner | OWNER | riskAssessment | Submit risk scores |
| 5 | ACTION_PLANNING | CAPA Owner | OWNER | actionPlanning | Add actions, start execution |
| 6 | ACTION_IN_PROGRESS | Assignees + Owner | OWNER | actionExecution | Complete & verify actions |
| 7 | EFFECTIVENESS_CHECK | QA Reviewer/Approver | QA_REVIEWER | effectivenessCheck | Submit check results |
| 8 | PENDING_CLOSURE | QA Approver | QA_APPROVER | qaApproval | Final approval |
| 9 | CLOSED | (system) | - | notifyClosed | Notification sent, process ends |

---

### Workflow History (dual-tracked)

The system maintains workflow history in two places:
1. **Flowable engine** - Process execution data (tasks, timers, gateways)
2. **`workflow_history` table** - Application-level step tracking for UI display

```
GET /api/v1/capas/{id}/workflow-history
```
Returns ordered list of steps with status (COMPLETED/CURRENT/PENDING), timestamps, assigned users, and comments.
