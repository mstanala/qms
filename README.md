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
