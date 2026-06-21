# QMS-Pharma Backend API Specification

**Tech Stack:** Java Spring Boot 3.5, PostgreSQL 17, Flowable, OpenSearch, Google Cloud Storage
**Base URL:** `/api/v1`
**Authentication:** OAuth 2.0 / SAML (JWT Bearer tokens)

---

## API Summary

| #  | Module            | API Group                    | Endpoints | Methods |
|----|-------------------|------------------------------|-----------|---------|
| 1  | Auth              | Authentication & Session     | 6         | POST/GET/DELETE |
| 2  | Users             | User Management              | 8         | CRUD |
| 3  | Roles             | Roles & Permissions          | 7         | CRUD |
| 4  | Deviations        | Deviation Management         | 14        | CRUD + Workflow |
| 5  | CAPA              | CAPA Management              | 18        | CRUD + Workflow |
| 6  | Change Control    | Change Control Management    | 16        | CRUD + Workflow |
| 7  | Attachments       | File Management              | 4         | CRUD |
| 8  | Audit Trail       | Audit & Compliance           | 3         | GET |
| 9  | Notifications     | Notification Management      | 4         | GET/PATCH |
| 10 | Dashboard         | Metrics & Analytics          | 4         | GET |
| 11 | Admin             | System Configuration         | 6         | CRUD |
| 12 | Lookup            | Reference Data               | 3         | GET |
| 13 | Search            | OpenSearch Integration       | 2         | GET/POST |
|    | **Total**         |                              | **~95**   |         |

---

## 1. Authentication & Session Management

### `POST /api/v1/auth/login`
Login with username/password. Returns JWT access + refresh tokens.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```
**Response:** `200 OK`
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600,
  "user": { "id": "uuid", "displayName": "string", "roles": ["string"] }
}
```

### `POST /api/v1/auth/refresh`
Refresh access token using refresh token.

### `POST /api/v1/auth/logout`
Invalidate current session.

### `POST /api/v1/auth/oauth2/callback`
OAuth 2.0 callback handler.

### `POST /api/v1/auth/saml/callback`
SAML SSO callback handler.

### `GET /api/v1/auth/me`
Get current authenticated user profile with permissions.

---

## 2. User Management

### `GET /api/v1/users`
List users with filters (pagination, search, department, role, status).

**Query params:** `page`, `size`, `sort`, `search`, `departmentId`, `roleId`, `userType`, `isActive`

### `GET /api/v1/users/{id}`
Get user details with roles and security profiles.

### `POST /api/v1/users`
Create new user. (VAULT_ADMIN only)

**Request:**
```json
{
  "employeeId": "string",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "userType": "OPERATOR|QA_SPECIALIST|QUALITY_MANAGER|...",
  "organizationId": "uuid",
  "plantSiteId": "uuid",
  "departmentId": "uuid",
  "managerId": "uuid",
  "roleIds": ["uuid"],
  "securityProfileIds": ["uuid"]
}
```

### `PUT /api/v1/users/{id}`
Update user details.

### `PATCH /api/v1/users/{id}/status`
Activate/deactivate/lock user.

### `POST /api/v1/users/{id}/roles`
Assign roles to user.

### `DELETE /api/v1/users/{id}/roles/{roleId}`
Remove role from user.

### `PUT /api/v1/users/{id}/password`
Change user password (requires current password for self, admin can reset).

---

## 3. Roles & Permissions

### `GET /api/v1/roles`
List all application roles.

### `GET /api/v1/roles/{id}`
Get role details with permissions.

### `POST /api/v1/roles`
Create custom role.

### `PUT /api/v1/roles/{id}`
Update role.

### `GET /api/v1/permissions`
List all available permissions (filterable by module).

### `GET /api/v1/security-profiles`
List security profiles.

### `POST /api/v1/security-profiles`
Create security profile with permissions.

---

## 4. Deviation Management

### `GET /api/v1/deviations`
List deviations with filters and pagination.

**Query params:** `page`, `size`, `sort`, `status[]`, `classification[]`, `category[]`, `type`, `departmentId`, `plantSiteId`, `dateFrom`, `dateTo`, `search`, `reportedById`, `assignedToId`

**Response:** `200 OK` - Paginated list with summary data.

### `GET /api/v1/deviations/{id}`
Get full deviation details including investigation, impact assessment, disposition, workflow history, and audit trail.

### `POST /api/v1/deviations`
Create new deviation. Starts Flowable workflow.

**Request:**
```json
{
  "title": "string",
  "description": "string",
  "type": "PLANNED|UNPLANNED",
  "category": "PROCESS|EQUIPMENT|...",
  "occurredDate": "datetime",
  "detectedDate": "datetime",
  "targetClosureDate": "datetime",
  "plantSiteId": "uuid",
  "departmentId": "uuid",
  "area": "string",
  "equipment": "string",
  "product": "string",
  "batchNumber": "string",
  "batchSize": "string",
  "affectedBatches": ["string"],
  "gmpImpact": false,
  "patientSafetyImpact": false,
  "regulatoryImpact": false,
  "sourceArea": "string"
}
```

### `PUT /api/v1/deviations/{id}`
Update deviation fields (respects workflow state restrictions).

### `PATCH /api/v1/deviations/{id}/classify`
Classify deviation (set classification: CRITICAL/MAJOR/MINOR). QA Specialist action.

**Request:**
```json
{
  "classification": "CRITICAL|MAJOR|MINOR",
  "comments": "string"
}
```

### `PATCH /api/v1/deviations/{id}/assign`
Assign investigator to deviation.

### `POST /api/v1/deviations/{id}/investigation`
Submit investigation findings.

**Request:**
```json
{
  "investigatorId": "uuid",
  "probableCause": "string",
  "rootCause": "string",
  "immediateActions": ["string"],
  "findings": "string",
  "conclusion": "string",
  "method": "string"
}
```

### `PUT /api/v1/deviations/{id}/investigation`
Update investigation.

### `POST /api/v1/deviations/{id}/impact-assessment`
Submit impact assessment.

### `POST /api/v1/deviations/{id}/disposition`
Submit disposition decision. Requires e-signature.

**Request:**
```json
{
  "decision": "RELEASE|RELEASE_WITH_CONDITIONS|REPROCESS|REWORK|REJECT|QUARANTINE|USE_AS_IS",
  "justification": "string",
  "conditions": "string",
  "qaReviewComments": "string",
  "electronicSignature": { "password": "string", "meaning": "string" }
}
```

### `PATCH /api/v1/deviations/{id}/status`
Transition deviation status (workflow action). Validates business rules.

**Request:**
```json
{
  "status": "UNDER_REVIEW|CLASSIFIED|...",
  "comments": "string",
  "electronicSignature": { "password": "string", "meaning": "string" }
}
```

### `POST /api/v1/deviations/{id}/initiate-capa`
Create CAPA from deviation. Links deviation to new CAPA.

### `GET /api/v1/deviations/{id}/audit-trail`
Get complete audit trail for deviation.

### `GET /api/v1/deviations/{id}/workflow-history`
Get workflow step history.

---

## 5. CAPA Management

### `GET /api/v1/capas`
List CAPAs with filters and pagination.

**Query params:** `page`, `size`, `sort`, `status[]`, `priority[]`, `type`, `sourceType`, `departmentId`, `plantSiteId`, `dateFrom`, `dateTo`, `search`, `ownerId`, `initiatorId`

### `GET /api/v1/capas/{id}`
Get full CAPA details including RCA, risk assessment, actions, effectiveness checks, workflow history.

### `POST /api/v1/capas`
Create new CAPA. Starts Flowable workflow.

**Request:**
```json
{
  "title": "string",
  "description": "string",
  "type": "CORRECTIVE|PREVENTIVE|CORRECTIVE_AND_PREVENTIVE",
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "sourceType": "DEVIATION|AUDIT_FINDING|...",
  "sourceReference": "string",
  "targetCompletionDate": "datetime",
  "ownerId": "uuid",
  "departmentId": "uuid",
  "plantSiteId": "uuid",
  "product": "string",
  "batchNumber": "string",
  "deviationId": "uuid"
}
```

### `PUT /api/v1/capas/{id}`
Update CAPA fields.

### `PATCH /api/v1/capas/{id}/status`
Transition CAPA status. Validates business rules (e.g., cannot close if actions incomplete).

### `PATCH /api/v1/capas/{id}/assign`
Assign CAPA owner or reassign.

### `POST /api/v1/capas/{id}/root-cause-analysis`
Submit root cause analysis.

**Request:**
```json
{
  "method": "FIVE_WHY|FISHBONE|FAULT_TREE|PARETO|FAILURE_MODE",
  "description": "string",
  "rootCauses": ["string"],
  "contributingFactors": ["string"],
  "fiveWhyEntries": [
    { "level": 1, "question": "string", "answer": "string" }
  ],
  "fishboneCategories": [
    { "categoryName": "Man (People)", "causes": ["string"] }
  ]
}
```

### `PUT /api/v1/capas/{id}/root-cause-analysis`
Update root cause analysis.

### `POST /api/v1/capas/{id}/risk-assessment`
Submit risk assessment (severity, occurrence, detection -> RPN).

**Request:**
```json
{
  "severity": 4,
  "occurrence": 3,
  "detection": 2,
  "riskLevel": "HIGH",
  "justification": "string"
}
```

### `POST /api/v1/capas/{id}/actions`
Add corrective or preventive action.

**Request:**
```json
{
  "description": "string",
  "type": "CORRECTIVE|PREVENTIVE",
  "assignedToId": "uuid",
  "dueDate": "datetime"
}
```

### `PUT /api/v1/capas/{id}/actions/{actionId}`
Update action details/status.

### `PATCH /api/v1/capas/{id}/actions/{actionId}/complete`
Mark action as completed with evidence.

**Request:**
```json
{
  "evidence": "string",
  "completedDate": "datetime"
}
```

### `PATCH /api/v1/capas/{id}/actions/{actionId}/verify`
Verify completed action. Requires e-signature.

### `POST /api/v1/capas/{id}/effectiveness-check`
Submit effectiveness check.

**Request:**
```json
{
  "criteria": "string",
  "checkDate": "datetime",
  "result": "EFFECTIVE|NOT_EFFECTIVE|PARTIALLY_EFFECTIVE",
  "evidence": "string",
  "comments": "string",
  "requiresRecurrence": false,
  "recurrenceMonths": 3,
  "electronicSignature": { "password": "string", "meaning": "string" }
}
```

### `POST /api/v1/capas/{id}/approve`
Approve CAPA at current workflow stage. Requires e-signature.

### `POST /api/v1/capas/{id}/reject`
Reject CAPA with reason.

### `GET /api/v1/capas/{id}/audit-trail`
Get complete audit trail for CAPA.

### `GET /api/v1/capas/{id}/ai-suggestions`
Get AI-assisted root cause suggestions based on historical data.

**Response:**
```json
{
  "suggestions": [
    {
      "text": "string",
      "reference": "string",
      "source": "HISTORICAL|INDUSTRY|GUIDELINE",
      "confidence": 0.85
    }
  ]
}
```

---

## 6. Change Control Management

### `GET /api/v1/change-requests`
List change requests with filters and pagination.

**Query params:** `page`, `size`, `sort`, `status[]`, `classification[]`, `type[]`, `priority[]`, `departmentId`, `plantSiteId`, `dateFrom`, `dateTo`, `search`, `changeOwnerId`

### `GET /api/v1/change-requests/{id}`
Get full change request details.

### `POST /api/v1/change-requests`
Create new change request. Starts Flowable workflow.

**Request:**
```json
{
  "title": "string",
  "description": "string",
  "justification": "string",
  "type": "PROCESS|EQUIPMENT|FACILITY|...",
  "category": "PRODUCT|NON_PRODUCT|...",
  "classification": "MINOR|MAJOR|CRITICAL",
  "priority": "URGENT|HIGH|MEDIUM|LOW",
  "departmentId": "uuid",
  "changeOwnerId": "uuid",
  "plantSiteId": "uuid",
  "targetImplementationDate": "datetime",
  "affectedAreas": ["string"],
  "validationRequired": false,
  "trainingRequired": false,
  "relatedDeviations": ["string"],
  "relatedCapas": ["string"]
}
```

### `PUT /api/v1/change-requests/{id}`
Update change request.

### `PATCH /api/v1/change-requests/{id}/status`
Transition change request status.

### `POST /api/v1/change-requests/{id}/impact-assessment`
Submit impact assessment (8 impact dimensions).

### `PUT /api/v1/change-requests/{id}/impact-assessment`
Update impact assessment.

### `POST /api/v1/change-requests/{id}/regulatory-filing`
Submit regulatory filing requirement.

### `POST /api/v1/change-requests/{id}/affected-documents`
Add affected documents.

### `POST /api/v1/change-requests/{id}/affected-products`
Add affected products.

### `POST /api/v1/change-requests/{id}/implementation-tasks`
Add implementation task.

### `PUT /api/v1/change-requests/{id}/implementation-tasks/{taskId}`
Update implementation task status.

### `POST /api/v1/change-requests/{id}/training-requirements`
Add training requirement.

### `POST /api/v1/change-requests/{id}/approvals`
Configure approval chain (add approvers).

### `PATCH /api/v1/change-requests/{id}/approvals/{approvalId}`
Submit approval decision. Requires e-signature.

**Request:**
```json
{
  "decision": "APPROVED|REJECTED|APPROVED_WITH_COMMENTS",
  "comments": "string",
  "electronicSignature": { "password": "string", "meaning": "string" }
}
```

### `POST /api/v1/change-requests/{id}/effectiveness-review`
Submit effectiveness review with criteria evaluation.

### `GET /api/v1/change-requests/{id}/audit-trail`
Get complete audit trail.

---

## 7. Attachments / File Management

### `POST /api/v1/attachments`
Upload file to Google Cloud Storage and create metadata record.

**Request:** `multipart/form-data`
- `file`: binary
- `recordType`: CAPA|DEVIATION|CHANGE_CONTROL
- `recordId`: uuid
- `category`: SUPPORTING_DATA|RISK_ASSESSMENT|VALIDATION|REGULATORY|TRAINING|EVIDENCE|INVESTIGATION|OTHER
- `description`: string

### `GET /api/v1/attachments?recordType={type}&recordId={id}`
List attachments for a record.

### `GET /api/v1/attachments/{id}/download`
Download attachment (generates signed GCS URL).

### `DELETE /api/v1/attachments/{id}`
Soft-delete attachment (marks as deleted, retains for audit).

---

## 8. Audit Trail

### `GET /api/v1/audit-trail`
Query audit trail entries with filters.

**Query params:** `recordType`, `recordId`, `userId`, `action`, `dateFrom`, `dateTo`, `page`, `size`

### `GET /api/v1/audit-trail/record/{recordType}/{recordId}`
Get all audit entries for a specific record.

### `GET /api/v1/audit-trail/export`
Export audit trail as PDF/CSV for regulatory submission.

**Query params:** `recordType`, `recordId`, `dateFrom`, `dateTo`, `format=PDF|CSV`

---

## 9. Notifications

### `GET /api/v1/notifications`
Get current user's notifications (paginated, filterable by read/unread).

### `GET /api/v1/notifications/unread-count`
Get unread notification count.

### `PATCH /api/v1/notifications/{id}/read`
Mark notification as read.

### `PATCH /api/v1/notifications/read-all`
Mark all notifications as read.

---

## 10. Dashboard & Metrics

### `GET /api/v1/dashboard/overview`
Get overview dashboard KPIs (open CAPAs, deviations, changes, overdue, pending reviews).

### `GET /api/v1/dashboard/capa-metrics`
Get CAPA-specific metrics (by status, priority, department, trend).

**Response matches `CapaDashboardMetrics` interface from frontend.**

### `GET /api/v1/dashboard/deviation-metrics`
Get deviation-specific metrics (by status, classification, category, department, trend).

**Response matches `DeviationDashboardMetrics` interface from frontend.**

### `GET /api/v1/dashboard/change-control-metrics`
Get change control metrics (by status, type, classification, priority, department, trend).

**Response matches `ChangeControlDashboardMetrics` interface from frontend.**

---

## 11. System Administration

### `GET /api/v1/admin/configurations`
List system configurations.

### `PUT /api/v1/admin/configurations/{key}`
Update system configuration. Audited.

### `GET /api/v1/admin/organizations`
List organizations.

### `GET /api/v1/admin/plant-sites`
List plant sites (filterable by organization).

### `GET /api/v1/admin/departments`
List departments (filterable by plant site).

### `POST /api/v1/admin/departments`
Create department.

---

## 12. Lookup / Reference Data

### `GET /api/v1/lookups?category={category}`
Get lookup values by category. Used for dropdowns.

### `GET /api/v1/products`
List products (for product selection in forms).

### `GET /api/v1/batches?productId={id}`
List batches for a product.

---

## 13. Search (OpenSearch)

### `GET /api/v1/search?q={query}&type={recordType}`
Global search across all record types.

### `POST /api/v1/search/advanced`
Advanced search with field-level filters.

**Request:**
```json
{
  "query": "string",
  "recordTypes": ["CAPA", "DEVIATION", "CHANGE_CONTROL"],
  "filters": {
    "status": ["OPEN"],
    "priority": ["HIGH", "CRITICAL"],
    "dateRange": { "from": "date", "to": "date" }
  },
  "page": 0,
  "size": 20
}
```

---

## 14. Electronic Signature

### `POST /api/v1/esignature/verify`
Verify e-signature (validates password, creates signature record).

**Request:**
```json
{
  "password": "string",
  "meaning": "Approved|Rejected|Reviewed|Verified",
  "recordType": "string",
  "recordId": "uuid",
  "action": "string"
}
```

---

## Common Patterns

### Pagination Response
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

### Error Response
```json
{
  "timestamp": "datetime",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/capas",
  "details": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

### Business Rule Validation Errors (422)
```json
{
  "status": 422,
  "error": "Business Rule Violation",
  "message": "CAPA cannot be closed: 2 actions are still pending",
  "ruleCode": "CAPA_CLOSE_ACTIONS_INCOMPLETE"
}
```

---

## Spring Boot Project Structure

```
qms-pharma-api/
├── src/main/java/com/qmspharma/
│   ├── QmsPharmaApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java          # OAuth2/SAML + JWT
│   │   ├── FlowableConfig.java          # Workflow engine
│   │   ├── OpenSearchConfig.java        # Search integration
│   │   ├── GcsStorageConfig.java        # Google Cloud Storage
│   │   ├── AuditConfig.java             # Audit trail interceptor
│   │   └── CorsConfig.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── UserController.java
│   │   ├── RoleController.java
│   │   ├── DeviationController.java
│   │   ├── CapaController.java
│   │   ├── ChangeRequestController.java
│   │   ├── AttachmentController.java
│   │   ├── AuditTrailController.java
│   │   ├── NotificationController.java
│   │   ├── DashboardController.java
│   │   ├── AdminController.java
│   │   ├── LookupController.java
│   │   └── SearchController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── UserService.java
│   │   ├── RoleService.java
│   │   ├── DeviationService.java
│   │   ├── CapaService.java
│   │   ├── ChangeRequestService.java
│   │   ├── AttachmentService.java
│   │   ├── AuditTrailService.java
│   │   ├── NotificationService.java
│   │   ├── DashboardService.java
│   │   ├── ESignatureService.java
│   │   ├── SequenceGeneratorService.java
│   │   ├── WorkflowService.java         # Flowable integration
│   │   ├── SearchService.java           # OpenSearch integration
│   │   └── StorageService.java          # GCS integration
│   ├── model/entity/
│   │   ├── Organization.java
│   │   ├── PlantSite.java
│   │   ├── Department.java
│   │   ├── User.java
│   │   ├── ApplicationRole.java
│   │   ├── Permission.java
│   │   ├── SecurityProfile.java
│   │   ├── Deviation.java
│   │   ├── DeviationInvestigation.java
│   │   ├── DeviationImpactAssessment.java
│   │   ├── DeviationDisposition.java
│   │   ├── Capa.java
│   │   ├── CapaRootCauseAnalysis.java
│   │   ├── CapaFiveWhyEntry.java
│   │   ├── CapaRiskAssessment.java
│   │   ├── CapaAction.java
│   │   ├── CapaEffectivenessCheck.java
│   │   ├── ChangeRequest.java
│   │   ├── ChangeImpactAssessment.java
│   │   ├── ChangeApproval.java
│   │   ├── ChangeImplementationTask.java
│   │   ├── Attachment.java
│   │   ├── AuditTrail.java
│   │   ├── WorkflowHistory.java
│   │   ├── ElectronicSignature.java
│   │   └── Notification.java
│   ├── model/dto/
│   │   ├── request/                     # Request DTOs
│   │   └── response/                    # Response DTOs
│   ├── model/enums/
│   │   ├── CapaStatus.java
│   │   ├── CapaPriority.java
│   │   ├── DeviationStatus.java
│   │   ├── ChangeStatus.java
│   │   └── ... (all enums)
│   ├── repository/
│   │   ├── DeviationRepository.java
│   │   ├── CapaRepository.java
│   │   ├── ChangeRequestRepository.java
│   │   └── ... (all repositories)
│   ├── workflow/                        # Flowable BPMN
│   │   ├── DeviationWorkflow.bpmn20.xml
│   │   ├── CapaWorkflow.bpmn20.xml
│   │   ├── ChangeControlWorkflow.bpmn20.xml
│   │   └── listeners/
│   │       ├── DeviationTaskListener.java
│   │       ├── CapaTaskListener.java
│   │       └── ChangeControlTaskListener.java
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── PermissionEvaluator.java
│   │   └── AuditInterceptor.java
│   └── exception/
│       ├── BusinessRuleException.java
│       ├── ResourceNotFoundException.java
│       └── GlobalExceptionHandler.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   ├── application-prod.yml
│   └── processes/
│       ├── deviation-workflow.bpmn20.xml
│       ├── capa-workflow.bpmn20.xml
│       └── change-control-workflow.bpmn20.xml
└── pom.xml
```

---

## Business Rules Summary

### CAPA Closure Rules
- All corrective actions must be VERIFIED
- All preventive actions must be VERIFIED
- At least one effectiveness check must be EFFECTIVE
- Required approvals must be obtained (e-signature)
- Audit trail must be complete

### Deviation Closure Rules
- Investigation must be completed
- Impact assessment must be submitted
- Disposition decision must be recorded with e-signature
- If capaRequired=true, linked CAPA must exist
- Site Quality Head approval required for CRITICAL deviations

### Change Control Closure Rules
- All implementation tasks must be COMPLETED
- All required approvals must be APPROVED
- If trainingRequired=true, all training must be COMPLETED
- If validationRequired=true, validation evidence must be attached
- Effectiveness review must be submitted