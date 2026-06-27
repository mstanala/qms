# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QMS-Pharma is a pharmaceutical Quality Management System built with an Angular microfrontend architecture (shell-app + remote MFEs) and a Java Spring Boot backend. It targets Indian pharma SMEs needing FDA/Schedule M compliance. The MVP focuses on CAPA Management, with modules for Deviation, Change Control, Document Control, Training, Audit, Risk, Supplier, Complaint, Nonconformance, and Equipment management.

## Architecture

**Microfrontend (Module Federation):**
- `shell-app` (port 4200) — Host app with layout, navigation, auth, admin, tools, profile. Loads remotes via `src/assets/mf.manifest.json`.
- `capa-mfe` (port 4201) — CAPA module, exposes `./CapaModule` with `CAPA_ROUTES`
- `deviation-mfe` (port 4202) — Deviation module, exposes `./DeviationModule`
- `change-control-mfe` (port 4203) — Change Control module, exposes `./ChangeControlModule`
- `document-mfe` (port 4204) — Document Control module, exposes `./DocumentModule`
- `training-mfe` (port 4205) — Training module, exposes `./TrainingModule`
- `qms-core-mfe` (port 4206) — Bundles Risk, Audit, Supplier, Complaint, Nonconformance, Equipment modules

Each MFE uses Angular 18 standalone components, Angular Material, `@angular-architects/module-federation`, and `ngx-build-plus`. Routes are permission-guarded via `permissionGuard` with `{ module, action, resource }` data.

**Backend:** Single Spring Boot 3.5 app (Java 21) at `backend/`, runs on port 8082.
- Package: `com.qmspharma` with standard layers: `controller/`, `service/`, `repository/`, `model/` (entity, dto, enums), `config/`, `security/`, `workflow/`, `exception/`
- Flowable 7.1.0 workflow engine with BPMN processes in `src/main/resources/processes/`
- PostgreSQL 17 (port 5434, database `qms`) with Flyway migrations
- Google Cloud Storage for document storage
- JWT auth (custom, not Keycloak)
- Swagger/OpenAPI at `/api-docs` and `/swagger-ui.html`

**Workflow Engine (Flowable):**
- 10 BPMN processes: capa, deviation, change-control, document, training, audit, complaint, equipment, nonconformance, supplier
- Process chaining (not nesting): Deviation -> CAPA -> Change Control are separate processes linked by record IDs
- Two assignment strategies: `assignee="${variable}"` (direct) and `candidateGroups` (role pool with claim)
- `WorkflowService` handles starting processes and completing tasks
- `workflow_history` table provides app-facing history; Flowable `ACT_*` tables hold engine state
- Task inbox API at `/api/v1/tasks/inbox` queries both assignee and candidate groups

## Common Commands

### Frontend

```bash
# Install dependencies (each MFE independently)
cd shell-app && npm install
cd capa-mfe && npm install
# ... same for deviation-mfe, change-control-mfe, document-mfe, training-mfe, qms-core-mfe

# Run individual MFE (start remotes before shell-app)
cd capa-mfe && npm start          # port 4201
cd shell-app && npm start         # port 4200

# Build
cd <mfe-dir> && npm run build

# Tests
cd <mfe-dir> && npm test
```

### Backend

```bash
cd backend

# Build (skip tests for speed)
./mvnw clean package -DskipTests

# Run
./mvnw spring-boot:run

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=CapaServiceTest

# Run a single test method
./mvnw test -Dtest="CapaServiceTest#testCreateCapa"
```

### Database

- PostgreSQL on port 5434, database `qms`
- Flyway migrations: `backend/src/main/resources/db/migration/` (V1 through V16)
- Standalone DDL/DML copies: `database/` directory
- Hibernate ddl-auto is `validate` — all schema changes must go through Flyway

## Key File Locations

| What | Where |
|------|-------|
| API docs & workflow guides | `docs/` |
| Flyway migrations | `backend/src/main/resources/db/migration/` |
| BPMN process definitions | `backend/src/main/resources/processes/` |
| Backend config | `backend/src/main/resources/application.yml` |
| MFE manifest (remote URLs) | `shell-app/src/assets/mf.manifest.json` |
| Shell routing | `shell-app/src/app/app.routes.ts` |
| Webpack MF configs | `<mfe-dir>/webpack.config.js` |

## Conventions

- All Angular MFEs use standalone components (no NgModules)
- Each MFE exposes routes as a named export (e.g., `CAPA_ROUTES`, `DEVIATION_ROUTES`)
- Backend entities extend `BaseEntity` with audit fields
- Sequence numbers generated via `SequenceGeneratorService` (e.g., CAPA-2024-001, DEV-2024-001)
- API base path: `/api/v1/<resource>` (e.g., `/api/v1/capas`, `/api/v1/deviations`, `/api/v1/change-requests`)
- Permission model: module + action + resource (checked by `permissionGuard` on frontend, security on backend)
- CORS configured for localhost ports 4200-4205

## Workflow Testing

Verify Flowable is working by checking:
1. Process definitions: `SELECT key_, name_ FROM act_re_procdef`
2. Active tasks: `SELECT id_, name_, task_def_key_ FROM act_ru_task`
3. Task inbox API: `GET /api/v1/tasks/inbox`
4. Workflow history API: `GET /api/v1/capas/{id}/workflow-history` (similar for deviations, change-requests)