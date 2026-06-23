# QMS Pharma - CAPA Management Platform

A specialized, AI-enabled Quality Management System (QMS) for pharmaceutical manufacturers, CDMOs, and nutraceutical companies. Built with **Module Federation (Microfrontend Architecture)**.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Shell App (Host)                     │
│                  Port: 4200                           │
│  ┌───────────────────────────────────────────────┐  │
│  │  Navigation | Layout | Auth | Module Loading   │  │
│  └───────────────────────────────────────────────┘  │
│                        │                             │
│            Module Federation                         │
│                        │                             │
│  ┌───────────────────────────────────────────────┐  │
│  │         CAPA MFE (Remote App)                  │  │
│  │         Port: 4201                             │  │
│  │  • Dashboard                                   │  │
│  │  • CAPA List                                   │  │
│  │  • CAPA Create/Edit                            │  │
│  │  • Root Cause Analysis                         │  │
│  │  • Effectiveness Verification                  │  │
│  │  • Audit Trail                                 │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 18 (Standalone Components) |
| UI Library | Angular Material |
| Microfrontend | Module Federation (@angular-architects/module-federation) |
| Build Tool | Webpack 5 (via ngx-build-plus) |
| Backend (planned) | Java Spring Boot 3.5 |
| Database (planned) | PostgreSQL 17 |
| Workflow Engine (planned) | Flowable |
| Search (planned) | OpenSearch |
| Storage (planned) | Google Cloud Storage |
| Auth (planned) | OAuth 2.0 / SAML |

## Project Structure

```
QMS-Pharma/
├── shell-app/           # Host application (port 4200)
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts      # Main layout with sidenav
│   │   │   ├── app.config.ts         # App configuration
│   │   │   ├── app.routes.ts         # Routes with MFE loading
│   │   │   └── pages/
│   │   │       └── dashboard/        # QMS Overview Dashboard
│   │   ├── assets/
│   │   │   └── mf.manifest.json      # Module Federation manifest
│   │   └── main.ts                   # Bootstrap with manifest loading
│   ├── webpack.config.js             # MF host configuration
│   └── package.json
│
├── capa-mfe/            # CAPA Remote Microfrontend (port 4201)
│   ├── src/
│   │   └── app/
│   │       └── capa/
│   │           ├── capa.routes.ts    # Exposed routes for MF
│   │           ├── models/           # Domain models
│   │           ├── services/         # CAPA service (mock data)
│   │           └── components/
│   │               ├── capa-dashboard/
│   │               ├── capa-list/
│   │               ├── capa-detail/
│   │               ├── capa-form/
│   │               └── root-cause-analysis/
│   ├── webpack.config.js             # MF remote configuration
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Installation

```bash
# Install Shell App dependencies
cd shell-app
npm install

# Install CAPA MFE dependencies
cd ../capa-mfe
npm install
```

### Running the Applications

You need to run both applications simultaneously:

**Terminal 1 - CAPA MFE (Remote - must start first):**
```bash
cd capa-mfe
npm start
# Runs on http://localhost:4201
```

**Terminal 2 - Shell App (Host):**
```bash
cd shell-app
npm start
# Runs on http://localhost:4200
```

Open http://localhost:4200 in your browser.

## CAPA Module Features (MVP1)

### Screens
1. **CAPA Dashboard** - KPIs, status breakdown, priority distribution, department analysis, trend chart
2. **CAPA List** - Filterable/searchable table of all CAPA records
3. **Create CAPA** - Multi-step form with validation (Basic Info → Assignment → Review)
4. **CAPA Detail** - Full view with tabs (Overview, RCA, Actions, Effectiveness, Audit Trail)
5. **Root Cause Analysis** - 5-Why, Fishbone/Ishikawa methods with AI suggestions

### Domain Features
- Deviation tracking
- Root cause analysis (5-Why, Fishbone, Fault Tree, FMEA)
- CAPA workflow automation (7-step process)
- Corrective and Preventive action tracking
- Effectiveness verification
- Risk assessment (Severity × Occurrence × Detection = RPN)
- Regulatory audit trail (21 CFR Part 11 ready)
- AI-assisted root cause suggestions

### CAPA Workflow Steps
1. Initiation
2. Review & Assignment
3. Investigation (Root Cause Analysis)
4. Action Planning
5. Implementation
6. Effectiveness Check
7. Closure

## Future Microfrontends (Planned)

| Module | Port | Phase |
|--------|------|-------|
| Document Control MFE | 4202 | Phase 2 |
| Change Control MFE | 4203 | Phase 3 |
| Deviation Management MFE | 4204 | Phase 3 |
| Supplier Quality MFE | 4205 | Phase 3 |
| Training Records MFE | 4206 | Phase 3 |

## Compliance

This platform is designed to meet:
- **21 CFR Part 11** - Electronic records and signatures
- **EU GMP Annex 11** - Computerized systems
- **ALCOA+ Data Integrity** - Attributable, Legible, Contemporaneous, Original, Accurate
- **Schedule M (India)** - Revised GMP requirements

## License

Proprietary - All rights reserved.

Both applications are compiled and running successfully:

Shell App (Host): http://localhost:4200
CAPA MFE (Remote): http://localhost:4201
Summary
I've built a complete Module Federation microfrontend architecture for the QMS Pharma CAPA Management Platform:

Shell App (Host - Port 4200)
Professional sidebar navigation with QMS branding
Dashboard with quality metrics overview
Module Federation host config loading remotes via manifest
Placeholders for future modules (Document Control, Change Control, etc.)
CAPA MFE (Remote - Port 4201)
Exposes ./CapaModule via Module Federation with these screens:

CAPA Dashboard - KPIs (open, overdue, closed), status/priority/department charts, monthly trends
CAPA List - Searchable/filterable table with status badges, priority indicators
Create CAPA - Multi-step stepper form (Basic Info → Assignment → Review & Submit)
CAPA Detail - Tabbed view (Overview, RCA, Actions, Effectiveness, Audit Trail)
Root Cause Analysis - 5-Why, Fishbone methods with AI-assisted suggestions panel
Key Technical Decisions
Angular 18 with standalone components (modern, tree-shakable)
@angular-architects/module-federation for MF integration
Angular Material for professional pharma UI
Mock service with realistic Indian pharma data (ready to swap for Spring Boot API)
All domain models prepared for PostgreSQL integration
Workflow steps aligned with pharma CAPA lifecycle
21 CFR Part 11 audit trail structure built-in
Adding Future Modules
To add new microfrontends (e.g., Document Control), simply:

Create a new Angular app on a new port (e.g., 4202)
Configure webpack to expose its routes
Add the remote entry to shell-app/src/assets/mf.manifest.json
Add a route in shell-app/src/app/app.routes.ts.
----------------

Flowable Testing
----------------
Flowable is integrated as a backend workflow engine for CAPA, Deviations, and Change Control. The UI/business APIs still drive the process, but each major business action also starts or
advances a Flowable process.

How It Works
On app startup, Flowable auto-deploys these BPMN files:

- capaProcess: backend/src/main/resources/processes/capa-process.bpmn20.xml:6
- deviationProcess: backend/src/main/resources/processes/deviation-process.bpmn20.xml:7
- changeControlProcess: backend/src/main/resources/processes/change-control-process.bpmn20.xml:6

When a record is created, backend starts a Flowable process using WorkflowService.startProcess(...).

Examples:

- CAPA create starts capaProcess
- Deviation create starts deviationProcess
- Change Request create starts changeControlProcess

Then when you perform business actions, backend completes the matching Flowable task:

- CAPA QA review completes qaReview
- CAPA Root Cause Analysis completes investigation
- CAPA Risk Assessment completes riskAssessment
- Deviation classification completes qaReview
- Deviation investigation completes investigation
- Change Control status transitions complete tasks like submitChange, impactAssessment, qaReview, etc.

The app also writes its own simplified workflow history into workflow_history, so there are two layers:

- Flowable tables: active engine state and tasks
- workflow_history: app-facing history displayed by APIs like /workflow-history

How To Test

1. Confirm BPMN processes deployed in DB:

select key_, name_, version_
from act_re_procdef
order by key_, version_;

Expected keys:

capaProcess
deviationProcess
changeControlProcess

2. Create a new CAPA, Deviation, or Change Control record from UI/API.

Then check active Flowable tasks:

select id_, name_, task_def_key_, proc_inst_id_, assignee_
from act_ru_task
order by create_time_ desc;

For a newly created CAPA, expect an active task like:

QA Review / qaReview

For a newly created Deviation:

QA Review & Classification / qaReview

For a newly created Change Control:

Complete & Submit Change Request / submitChange

3. Test through backend task inbox API:

curl -H "Authorization: Bearer <TOKEN>" \
"http://localhost:8082/api/v1/tasks/by-record-type/CAPA"

Also:

curl -H "Authorization: Bearer <TOKEN>" \
"http://localhost:8082/api/v1/tasks/inbox?candidateGroups=QA_REVIEWER&candidateGroups=QA_APPROVER"

4. Advance the record through the normal business API/UI action.

Example: approve/review CAPA status, then submit RCA. After each step, check:

select id_, name_, task_def_key_, proc_inst_id_, assignee_
from act_ru_task
order by create_time_ desc;

The active task should move forward, for example:

qaReview -> investigation -> riskAssessment -> actionPlanning

5. Verify app workflow history:

curl -H "Authorization: Bearer <TOKEN>" \
"http://localhost:8082/api/v1/capas/<CAPA_ID>/workflow-history"

Similar endpoints:

GET /api/v1/deviations/{id}/workflow-history
GET /api/v1/change-requests/{id}/workflow-history

Important Caveat
Current backend WorkflowService logs Flowable failures but does not always fail the business transaction. So if Flowable breaks, the record may still save, but workflow tasks may not be created or
advanced. The strongest indicators that Flowable is working are:

- records appear in ACT_RU_TASK
- process definitions exist in ACT_RE_PROCDEF
- task inbox API returns active tasks
- tasks move to the next BPMN step after business actions
- backend logs show messages like Started process... and Completed task...
-----------
SOP stands for Standard Operating Procedure.

In Pharma QMS, an SOP is a controlled document that describes the approved step-by-step process for performing a specific activity consistently and in compliance with regulatory requirements.

Example SOPs in a Pharmaceutical Company
SOP Number

SOP Title

SOP-001

Deviation Management Procedure

SOP-002

CAPA Management Procedure

SOP-003

Change Control Procedure

SOP-004

Equipment Calibration Procedure

SOP-005

Document Control Procedure

SOP-006

Training Management Procedure

SOP-007

Audit Management Procedure

SOP-008

Complaint Handling Procedure

SOP-009

Risk Management Procedure

SOP-010

Supplier Qualification Procedure
Typical SOP Structure

1. Purpose

Why the procedure exists.

Example:

To establish a process for identifying, investigating, documenting, and closing deviations.

2. Scope

Who and what the SOP applies to.

Example:

Applicable to all manufacturing, quality control, and quality assurance personnel.

3. Responsibilities

Defines user roles.
ole

Responsibility

Operator

Report deviations

QA Reviewer

Review investigations

QA Manager

Approve closure
4. Procedure

Step-by-step instructions.

Example:
1. Identify deviation.
2. Create deviation record.
3. Assign investigator.
4. Perform root cause analysis.
5. Complete risk assessment.
6. Create CAPA if required.
7. Verify effectiveness.
8. Close deviation.
5. References

Examples:

* 21 CFR Part 11
* EU Annex 11
* ICH Q9
* Internal Policies

6. Forms and Attachments

Examples:

* Deviation Form
* CAPA Form
* Risk Assessment Form

⸻

SOP Lifecycle in Your QMS

Since you already implemented Document Management + Training Management + Flowable, the SOP workflow usually looks like:
Draft SOP
↓
Review
↓
QA Approval
↓
Effective
↓
Training Assignment
↓
Periodic Review
↓
Revision
↓
Obsolete
Example

A CAPA identifies that operators are not following cleaning procedures.

CAPA Action:

* Revise Cleaning SOP

Document Workflow:
Change Control
↓
Update SOP
↓
Review
↓
Approval
↓
Release Version 2.0
↓
Assign Training
↓
Track Completion
How SOPs Connect to Other QMS Modules
Deviation
↓
CAPA
↓
Change Control
↓
SOP Revision
↓
Training Assignment
↓
Effectiveness Check
This is one of the most common end-to-end pharmaceutical quality workflows and should definitely be included in your UAT and validation test scenarios.

Example UAT Scenario

Test ID: UAT-SOP-001

Business Need: SOP revision after CAPA implementation.

Steps:

1. Create Deviation.
2. Complete investigation.
3. Create CAPA.
4. Create Change Control.
5. Revise SOP.
6. Approve SOP.
7. Release new version.
8. Assign training automatically.
9. Complete training.
10. Verify effectiveness.

Expected Result:


* SOP version updated.
* Previous version archived.
* Training assigned.
* Audit trail generated.
* Electronic signatures captured.
* CAPA closure permitted only after training completion.

------------------Flowable Workflow------------------------- 
------------------------------------------------------------
Flowable Workflow Task Assignment — End-to-End Flow Explained

Your codebase uses 3 separate Flowable BPMN processes that chain together to handle the full pharma QMS lifecycle. Each process assigns tasks to the next role using two Flowable mechanisms:       
flowable:assignee (direct assignment) and flowable:candidateGroups (role-based pool).

How Task Assignment Works in Flowable

Flowable has two assignment models in your BPMN definitions:

┌────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────┐
│               Mechanism                │                                How it works                                │                    Example                    │
├────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ flowable:assignee="${variableId}"      │ Directly assigns task to a specific user (resolved from process variable)  │ assignee="${assignedToId}" → the investigator │
├────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ flowable:candidateGroups="ROLE1,ROLE2" │ Task appears in the inbox of all users in those roles; anyone can claim it │ candidateGroups="QA_APPROVER"                 │
└────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────┘

The TaskInboxService (TaskInboxService.java:26-39) queries both:
query.or()
.taskAssignee(userId)           // tasks directly assigned to me
.taskCandidateGroupIn(groups)   // tasks available to my role groups
.endOr();

  ---
The Complete Flow — Step by Step

PHASE 1: Deviation Process (deviation-process.bpmn20.xml)

START → qaReview → notifyInvestigator → investigation → impactAssessment → disposition → [CAPA Gateway] → capaInitiation → pendingClosure → END

Step 1: Operator Creates Deviation
- DeviationService.create() (line 74) starts the Flowable process:
  workflowService.startProcess("deviationProcess", dev.getId().toString(), vars);
- Process variables set: reportedById, assignedToId, deviationNumber, capaRequired=false
- Flowable immediately creates the first userTask: qaReview

Step 2: QA Reviewer/Approver classifies → Task: qaReview
- BPMN (deviation-process.bpmn20.xml:19-23):
  <userTask id="qaReview" flowable:candidateGroups="QA_REVIEWER,QA_APPROVER"/>
- Task appears in inbox of anyone with QA_REVIEWER or QA_APPROVER role
- A QA person claims the task via TaskInboxService.claimTask()
- When DeviationService.classify() is called (line 175), it:
  a. Sets classification and assignedToId as task variables
  b. Calls workflowService.completeTask(processId, "qaReview", taskVars) (line 190)
  c. Flowable automatically advances to notifyInvestigator (service task) → then to investigation (user task)

Step 3: QA Investigator investigates → Task: investigation
- BPMN (deviation-process.bpmn20.xml:41-46):
  <userTask id="investigation" flowable:assignee="${assignedToId}" flowable:dueDate="${targetClosureDate}"/>
- Directly assigned to ${assignedToId} — the investigator set during classification
- The notifyInvestigator service task fires NotificationDelegate to send a notification
- Boundary timer: if not completed in 25 days → escalationDelegate fires
- DeviationService.submitInvestigation() (line 234) completes this task → Flowable advances to impactAssessment

Step 4: QA Reviewer reviews impact → Task: impactAssessment
- BPMN (deviation-process.bpmn20.xml:51-55):
  <userTask id="impactAssessment" flowable:candidateGroups="QA_REVIEWER,QA_APPROVER"/>
- Back to the QA pool — any QA_REVIEWER or QA_APPROVER can claim
- DeviationService.submitImpactAssessment() (line 281) completes → advances to disposition

Step 5: QA Manager approves disposition → Task: disposition
- BPMN (deviation-process.bpmn20.xml:60-64):
  <userTask id="disposition" flowable:candidateGroups="QA_APPROVER"/>
- Only QA_APPROVER role (QA Manager level)
- DeviationService.submitDisposition() (line 319) sets capaRequired variable and completes the task
- Flowable hits the exclusive gateway capaGateway:

Step 6: Gateway Decision — CAPA Required?
- BPMN (deviation-process.bpmn20.xml:69-77):
  <exclusiveGateway id="capaGateway"/>
  <sequenceFlow> ${capaRequired == true}  → capaInitiation </sequenceFlow>
  <sequenceFlow> ${capaRequired == false} → pendingClosure </sequenceFlow>
- If capaRequired == true → Flowable creates capaInitiation task (assigned to QA_REVIEWER,OWNER)
- If capaRequired == false → skips straight to pendingClosure

Step 7: CAPA Initiation & Closure → Tasks: capaInitiation, pendingClosure
- After CAPA is initiated, transitionStatus() (line 376-378) completes capaInitiation
- Final task pendingClosure goes to QA_APPROVER for final sign-off
- On closure, notifyClosed service task sends notification to the original reporter

  ---
PHASE 2: CAPA Process (capa-process.bpmn20.xml)

START → qaReview → [Approved?] → investigation → riskAssessment → actionPlanning → actionExecution → effectivenessCheck → [Effective?] → qaApproval → END
→ [Rejected?] → END

The CAPA is created as a separate Flowable process via CapaService.create() (line 75):

Step 8: QA Reviews CAPA → Task: qaReview
- candidateGroups="QA_REVIEWER" — QA pool reviews
- Gateway: reviewDecision == 'APPROVED' → continues; 'REJECTED' → ends

Step 9: CAPA Owner does Root Cause Analysis → Task: investigation
- assignee="${ownerId}" — directly assigned to the CAPA owner
- CapaService.submitRca() (line 186) completes → advances to riskAssessment

Step 10: CAPA Owner does Risk Assessment → Task: riskAssessment
- assignee="${ownerId}" — same owner continues

Step 11: CAPA Owner plans actions → Task: actionPlanning
- assignee="${ownerId}" — owner defines corrective/preventive actions
- CapaService.startActionExecution() (line 333) validates at least 1 action exists, then completes

Step 12: CAPA Owner executes actions → Task: actionExecution
- assignee="${ownerId}" — owner monitors action completion
- Individual actions assigned to different users via CapaService.addAction() (notifications sent)
- Boundary timer: repeats every 7 days for 3 cycles (R3/P7D) → reminderDelegate fires
- CapaService.completeActionExecution() (line 356) validates all actions verified before completing

Step 13: Effectiveness Verification → Task: effectivenessCheck
- candidateGroups="QA_REVIEWER,QA_APPROVER" — QA pool verifies
- Gateway: effectivenessResult == 'EFFECTIVE' → proceed to closure
- NOT effective → loops back to actionPlanning (line 90-92 in BPMN) — this is a re-plan cycle

Step 14: QA Approval for Closure → Task: qaApproval
- candidateGroups="QA_APPROVER" — QA Manager final sign-off
- notifyClosed service task notifies the initiator

  ---
PHASE 3: Change Control Process (change-control-process.bpmn20.xml)

START → submitChange → impactAssessment → qaReview → [RA needed?] → raReview → pendingApproval → [Approved?] → implementation → verification → effectivenessCheck → END

Initiated when a CAPA action requires SOP revision:

Step 15: Change Owner submits → Task: submitChange
- assignee="${changeOwnerId}" — directly assigned

Step 16: Impact Assessment → Task: impactAssessment
- assignee="${changeOwnerId}" — same owner assesses 8 impact dimensions

Step 17: QA Review → Task: qaReview
- assignee="${qaReviewerId}" — specific QA reviewer assigned at creation
- Gateway: regulatoryFilingRequired == true → route to RA Review; false → skip to Approval

Step 18: RA Review (conditional) → Task: raReview
- candidateGroups="QA_REVIEWER" — regulatory pool

Step 19: Approval → Task: pendingApproval
- candidateGroups="QA_APPROVER,APPROVER" — approval committee
- Gateway: APPROVED → implementation; REJECTED → end

Step 20: Implementation (SOP revision happens here) → Task: implementation
- assignee="${changeOwnerId}" with dueDate="${targetImplementationDate}"
- Boundary timer: 30 days → escalation
- This is where the Document Controller revises the SOP (via the document-process)

Step 21: Verification → Task: verification
- candidateGroups="QA_REVIEWER" — QA verifies all tasks, docs, training complete

Step 22: Effectiveness Check → Task: effectivenessCheck
- candidateGroups="QA_APPROVER" — final effectiveness evaluation

  ---
PHASE 4: Document & Training Processes

Document Process (document-process.bpmn20.xml):
draftReview (DOC_REVIEWER,QA_REVIEWER) → [Approved?] → qaApproval (QA_APPROVER) → training (TRAINING_COORDINATOR,QA_REVIEWER) → makeEffective (auto)
- Revision loop: if REVISION_REQUIRED → back to authorRevision (assigned to ${authorId})

Training Process (training-process.bpmn20.xml):
notifyTrainee (auto) → trainingCompletion (assignee=${traineeId}) → [Assessment?] → trainingAssessment (${traineeId}) → trainerVerification (${trainerId}) → [Effective?] → recordCompletion (auto)
- If training not effective → loops back to trainingCompletion
- 7-day overdue timer with escalation

  ---
Summary: Role-to-Task Mapping Across the Full Flow

┌──────┬────────────────────────────┬───────────────────────────┬─────────────────────────────────────┐
│ Step │            Task            │        Assigned To        │              Mechanism              │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 1    │ Deviation Created          │ Operator                  │ API call (no Flowable task)         │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 2    │ QA Review & Classification │ QA_REVIEWER, QA_APPROVER  │ candidateGroups (claim from pool)   │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 3    │ Investigation              │ Specific investigator     │ assignee="${assignedToId}" (direct) │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 4    │ Impact Assessment          │ QA_REVIEWER, QA_APPROVER  │ candidateGroups                     │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 5    │ Disposition                │ QA_APPROVER only          │ candidateGroups                     │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 6    │ CAPA Initiation            │ QA_REVIEWER, OWNER        │ candidateGroups                     │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 7    │ CAPA QA Review             │ QA_REVIEWER               │ candidateGroups                     │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 8    │ Root Cause Analysis        │ CAPA Owner                │ assignee="${ownerId}"               │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 9    │ Risk Assessment            │ CAPA Owner                │ assignee="${ownerId}"               │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 10   │ Action Planning            │ CAPA Owner                │ assignee="${ownerId}"               │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 11   │ Action Execution           │ CAPA Owner                │ assignee="${ownerId}"               │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 12   │ Effectiveness Check        │ QA_REVIEWER, QA_APPROVER  │ candidateGroups                     │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 13   │ QA Closure Approval        │ QA_APPROVER               │ candidateGroups                     │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 14   │ Change Control Submit      │ Change Owner              │ assignee="${changeOwnerId}"         │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 15   │ SOP Draft Review           │ DOC_REVIEWER, QA_REVIEWER │ candidateGroups                     │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 16   │ SOP QA Approval            │ QA_APPROVER               │ candidateGroups                     │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 17   │ Training Assignment        │ TRAINING_COORDINATOR      │ candidateGroups                     │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 18   │ Training Completion        │ Specific trainee          │ assignee="${traineeId}"             │
├──────┼────────────────────────────┼───────────────────────────┼─────────────────────────────────────┤
│ 19   │ Trainer Verification       │ Specific trainer          │ assignee="${trainerId}"             │
└──────┴────────────────────────────┴───────────────────────────┴─────────────────────────────────────┘

Key Design Patterns

1. Process chaining, not nesting: Deviation → CAPA → Change Control are separate Flowable processes linked by record IDs. The Java service code creates the next process when needed (e.g., CAPA
   created from deviation, Change Control created from CAPA action).
2. Two assignment strategies:
   - Direct assignment (assignee) for tasks with a known responsible person (investigator, CAPA owner, trainee)
   - Candidate groups for tasks that go to a role pool where anyone qualified can claim
3. Gateways drive branching: Exclusive gateways at key decision points (capaRequired, regulatoryFilingRequired, effectivenessResult, reviewDecision) determine the next path based on variables set
   when completing the previous task.
4. Automatic notifications: NotificationDelegate service tasks fire between user tasks to notify the next person.
5. Escalation timers: Boundary timer events trigger EscalationDelegate when tasks go overdue (25 days for investigation, 7 days for training, 30 days for implementation).
--------------------------------------------
