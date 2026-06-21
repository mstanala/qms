# QMS-Pharma Backend API Documentation

Generated from the current Spring controllers in `backend/src/main/java/com/qmspharma/controller`.

Base URL: `/api/v1`

Authentication: protected endpoints expect `Authorization: Bearer <accessToken>` unless explicitly exposed by security configuration.

Common pagination query params for Spring `Pageable` endpoints:

```text
page=0&size=20&sort=createdAt,desc
```

Common paginated response shape:

```json
{
  "content": [],
  "pageable": {},
  "totalElements": 0,
  "totalPages": 0,
  "last": true,
  "size": 20,
  "number": 0,
  "sort": {},
  "first": true,
  "numberOfElements": 0,
  "empty": true
}
```

Common error response:

```json
{
  "timestamp": "2026-06-21T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/example",
  "ruleCode": "OPTIONAL_RULE_CODE",
  "details": [
    {
      "field": "title",
      "message": "must not be blank"
    }
  ]
}
```

## Auth

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| POST | `/api/v1/auth/login` | None | None | `LoginRequest` | `200 AuthResponse` |
| POST | `/api/v1/auth/refresh` | None | None | `RefreshTokenRequest` | `200 AuthResponse` |
| POST | `/api/v1/auth/logout` | None | None | None | `200 No content` |
| GET | `/api/v1/auth/me` | None | None | None | `200 UserResponse` |

## Users

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/users` | None | `search`, `departmentId`, `userType`, `page`, `size`, `sort` | None | `200 Page<UserResponse>` |
| GET | `/api/v1/users/{id}` | `id: UUID` | None | None | `200 UserResponse` |
| POST | `/api/v1/users` | None | None | `CreateUserRequest` | `201 UserResponse` |
| PUT | `/api/v1/users/{id}` | `id: UUID` | None | `UpdateUserRequest` | `200 UserResponse` |
| PATCH | `/api/v1/users/{id}/status` | `id: UUID` | None | `UserStatusRequest` | `200 No content` |
| POST | `/api/v1/users/{id}/roles` | `id: UUID` | None | `AssignRolesRequest` | `200 No content` |
| DELETE | `/api/v1/users/{id}/roles/{roleId}` | `id: UUID`, `roleId: UUID` | None | None | `204 No content` |
| PUT | `/api/v1/users/{id}/password` | `id: UUID` | None | `ChangePasswordRequest` | `200 No content` |

## Roles, Permissions, Security Profiles

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/roles` | None | None | None | `200 List<RoleResponse>` |
| GET | `/api/v1/roles/{id}` | `id: UUID` | None | None | `200 RoleResponse` |
| POST | `/api/v1/roles` | None | None | `CreateRoleRequest` | `201 RoleResponse` |
| PUT | `/api/v1/roles/{id}` | `id: UUID` | None | `CreateRoleRequest` | `200 RoleResponse` |
| GET | `/api/v1/permissions` | None | `module` | None | `200 List<PermissionResponse>` |
| GET | `/api/v1/security-profiles` | None | None | None | `200 List<SecurityProfileResponse>` |
| POST | `/api/v1/security-profiles` | None | None | `CreateSecurityProfileRequest` | `201 SecurityProfileResponse` |

## Deviations

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/deviations` | None | `status`, `classification`, `category`, `type`, `departmentId`, `plantSiteId`, `search`, `page`, `size`, `sort` | None | `200 Page<DeviationResponse>` |
| GET | `/api/v1/deviations/{id}` | `id: UUID` | None | None | `200 DeviationResponse` |
| POST | `/api/v1/deviations` | None | None | `CreateDeviationRequest` | `201 DeviationResponse` |
| PUT | `/api/v1/deviations/{id}` | `id: UUID` | None | `UpdateDeviationRequest` | `200 DeviationResponse` |
| PATCH | `/api/v1/deviations/{id}/classify` | `id: UUID` | None | `ClassifyDeviationRequest` | `200 DeviationResponse` |
| PATCH | `/api/v1/deviations/{id}/assign` | `id: UUID` | None | `AssignInvestigatorRequest` | `200 DeviationResponse` |
| POST | `/api/v1/deviations/{id}/investigation` | `id: UUID` | None | `SubmitInvestigationRequest` | `200 DeviationResponse` |
| PUT | `/api/v1/deviations/{id}/investigation` | `id: UUID` | None | `SubmitInvestigationRequest` | `200 DeviationResponse` |
| POST | `/api/v1/deviations/{id}/impact-assessment` | `id: UUID` | None | `SubmitImpactAssessmentRequest` | `200 DeviationResponse` |
| POST | `/api/v1/deviations/{id}/disposition` | `id: UUID` | None | `SubmitDispositionRequest` | `200 DeviationResponse` |
| PATCH | `/api/v1/deviations/{id}/status` | `id: UUID` | None | `StatusTransitionRequest` | `200 DeviationResponse` |
| GET | `/api/v1/deviations/{id}/audit-trail` | `id: UUID` | None | None | `200 List<AuditTrailResponse>` |
| GET | `/api/v1/deviations/{id}/workflow-history` | `id: UUID` | None | None | `200 List<WorkflowHistoryResponse>` |

## CAPA

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/capas` | None | `status`, `priority`, `type`, `sourceType`, `departmentId`, `plantSiteId`, `search`, `page`, `size`, `sort` | None | `200 Page<CapaResponse>` |
| GET | `/api/v1/capas/{id}` | `id: UUID` | None | None | `200 CapaResponse` |
| POST | `/api/v1/capas` | None | None | `CreateCapaRequest` | `201 CapaResponse` |
| PUT | `/api/v1/capas/{id}` | `id: UUID` | None | `UpdateCapaRequest` | `200 CapaResponse` |
| PATCH | `/api/v1/capas/{id}/status` | `id: UUID` | None | `StatusTransitionRequest` | `200 CapaResponse` |
| POST | `/api/v1/capas/{id}/root-cause-analysis` | `id: UUID` | None | `SubmitRcaRequest` | `200 CapaResponse` |
| PUT | `/api/v1/capas/{id}/root-cause-analysis` | `id: UUID` | None | `SubmitRcaRequest` | `200 CapaResponse` |
| POST | `/api/v1/capas/{id}/risk-assessment` | `id: UUID` | None | `SubmitRiskAssessmentRequest` | `200 CapaResponse` |
| POST | `/api/v1/capas/{id}/actions` | `id: UUID` | None | `CreateCapaActionRequest` | `201 CapaActionResponse` |
| PUT | `/api/v1/capas/{id}/actions/{actionId}` | `id: UUID`, `actionId: UUID` | None | `UpdateCapaActionRequest` | `200 CapaActionResponse` |
| PATCH | `/api/v1/capas/{id}/actions/{actionId}/complete` | `id: UUID`, `actionId: UUID` | None | `CompleteActionRequest` | `200 CapaActionResponse` |
| PATCH | `/api/v1/capas/{id}/actions/{actionId}/verify` | `id: UUID`, `actionId: UUID` | None | `VerifyActionRequest` | `200 CapaActionResponse` |
| POST | `/api/v1/capas/{id}/effectiveness-check` | `id: UUID` | None | `SubmitEffectivenessCheckRequest` | `200 CapaResponse` |
| POST | `/api/v1/capas/{id}/approve` | `id: UUID` | None | `ApproveRejectRequest` | `200 CapaResponse` |
| POST | `/api/v1/capas/{id}/reject` | `id: UUID` | None | `ApproveRejectRequest` | `200 CapaResponse` |
| GET | `/api/v1/capas/{id}/audit-trail` | `id: UUID` | None | None | `200 List<AuditTrailResponse>` |

## Change Requests

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/change-requests` | None | `status`, `classification`, `type`, `priority`, `departmentId`, `plantSiteId`, `search`, `page`, `size`, `sort` | None | `200 Page<ChangeRequestResponse>` |
| GET | `/api/v1/change-requests/{id}` | `id: UUID` | None | None | `200 ChangeRequestResponse` |
| POST | `/api/v1/change-requests` | None | None | `CreateChangeRequestRequest` | `201 ChangeRequestResponse` |
| PUT | `/api/v1/change-requests/{id}` | `id: UUID` | None | `UpdateChangeRequestRequest` | `200 ChangeRequestResponse` |
| PATCH | `/api/v1/change-requests/{id}/status` | `id: UUID` | None | `StatusTransitionRequest` | `200 ChangeRequestResponse` |
| POST | `/api/v1/change-requests/{id}/impact-assessment` | `id: UUID` | None | `SubmitChangeImpactRequest` | `200 No content` |
| PUT | `/api/v1/change-requests/{id}/impact-assessment` | `id: UUID` | None | `SubmitChangeImpactRequest` | `200 No content` |
| POST | `/api/v1/change-requests/{id}/affected-documents` | `id: UUID` | None | `AddAffectedDocumentRequest` | `201 No content` |
| POST | `/api/v1/change-requests/{id}/affected-products` | `id: UUID` | None | `AddAffectedProductRequest` | `201 No content` |
| POST | `/api/v1/change-requests/{id}/implementation-tasks` | `id: UUID` | None | `AddImplementationTaskRequest` | `201 No content` |
| PUT | `/api/v1/change-requests/{id}/implementation-tasks/{taskId}` | `id: UUID`, `taskId: UUID` | None | `UpdateImplementationTaskRequest` | `200 No content` |
| POST | `/api/v1/change-requests/{id}/training-requirements` | `id: UUID` | None | `AddTrainingRequirementRequest` | `201 No content` |
| POST | `/api/v1/change-requests/{id}/approvals` | `id: UUID` | None | `AddApproverRequest` | `201 No content` |
| PATCH | `/api/v1/change-requests/{id}/approvals/{approvalId}` | `id: UUID`, `approvalId: UUID` | None | `SubmitApprovalDecisionRequest` | `200 No content` |
| POST | `/api/v1/change-requests/{id}/effectiveness-review` | `id: UUID` | None | `SubmitEffectivenessReviewRequest` | `200 No content` |
| GET | `/api/v1/change-requests/{id}/audit-trail` | `id: UUID` | None | None | `200 List<AuditTrailResponse>` |

## Attachments

| Method | URL | URL params | Query params | Request content | Response JSON |
|---|---|---|---|---|---|
| POST | `/api/v1/attachments` | None | multipart fields: `file`, `recordType`, `recordId`, optional `category`, optional `description` | `multipart/form-data` | `201 AttachmentResponse` |
| GET | `/api/v1/attachments` | None | `recordType`, `recordId` | None | `200 List<AttachmentResponse>` |
| GET | `/api/v1/attachments/{id}/download` | `id: UUID` | None | None | `200 {"url":"string"}` |
| DELETE | `/api/v1/attachments/{id}` | `id: UUID` | None | None | `204 No content` |

Multipart upload example:

```text
file=<binary>
recordType=DEVIATION
recordId=00000000-0000-0000-0000-000000000001
category=INVESTIGATION
description=Investigation evidence
```

## Audit Trail

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/audit-trail` | None | required `recordType`, required `recordId`, `page`, `size`, `sort` | None | `200 Page<AuditTrailResponse>` |
| GET | `/api/v1/audit-trail/record/{recordType}/{recordId}` | `recordType: String`, `recordId: UUID` | None | None | `200 List<AuditTrailResponse>` |

## Notifications

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/notifications` | None | `isRead`, `page`, `size`, `sort` | None | `200 Page<NotificationResponse>` |
| GET | `/api/v1/notifications/unread-count` | None | None | None | `200 {"count":0}` |
| PATCH | `/api/v1/notifications/{id}/read` | `id: UUID` | None | None | `200 No content` |
| PATCH | `/api/v1/notifications/read-all` | None | None | None | `200 No content` |

## Dashboard

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/dashboard/overview` | None | None | None | `200 DashboardResponse` |
| GET | `/api/v1/dashboard/capa-metrics` | None | None | None | `200 CapaMetricsResponse` |
| GET | `/api/v1/dashboard/deviation-metrics` | None | None | None | `200 DeviationMetricsResponse` |
| GET | `/api/v1/dashboard/change-control-metrics` | None | None | None | `200 ChangeControlMetricsResponse` |

## Administration and Lookups

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/admin/configurations` | None | None | None | `200 List<SystemConfiguration>` |
| PUT | `/api/v1/admin/configurations/{key}` | `key: String` | None | `UpdateConfigRequest` | `200 SystemConfiguration` |
| GET | `/api/v1/admin/organizations` | None | None | None | `200 List<Organization>` |
| GET | `/api/v1/admin/plant-sites` | None | `organizationId` | None | `200 List<PlantSite>` |
| GET | `/api/v1/admin/departments` | None | `plantSiteId` | None | `200 List<Department>` |
| POST | `/api/v1/admin/departments` | None | None | `CreateDepartmentRequest` | `201 Department` |
| GET | `/api/v1/lookups` | None | required `category` | None | `200 List<LookupValueResponse>` |
| GET | `/api/v1/products` | None | None | None | `200 List<Product>` |
| GET | `/api/v1/batches` | None | required `productId` | None | `200 List<Batch>` |

## Search and Electronic Signature

| Method | URL | URL params | Query params | Request JSON | Response JSON |
|---|---|---|---|---|---|
| GET | `/api/v1/search` | None | required `q`, optional `type` | None | `200 {"results":[],"total":0}` |
| POST | `/api/v1/search/advanced` | None | None | `AdvancedSearchRequest` | `200 {"results":[],"total":0}` |
| POST | `/api/v1/esignature/verify` | None | None | `VerifyESignatureRequest` | `200 ElectronicSignature` |

## Request JSON Schemas

Fields marked with `(required)` have validation annotations in the DTO.

### LoginRequest

```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

### RefreshTokenRequest

```json
{
  "refreshToken": "string (required)"
}
```

### CreateUserRequest

```json
{
  "employeeId": "string (required)",
  "username": "string (required)",
  "email": "user@example.com (required)",
  "firstName": "string (required)",
  "lastName": "string (required)",
  "userType": "string (required)",
  "organizationId": "uuid (required)",
  "plantSiteId": "uuid",
  "departmentId": "uuid",
  "managerId": "uuid",
  "phone": "string",
  "jobTitle": "string",
  "roleIds": ["uuid"],
  "securityProfileIds": ["uuid"]
}
```

### UpdateUserRequest

```json
{
  "email": "user@example.com",
  "firstName": "string",
  "lastName": "string",
  "userType": "string",
  "departmentId": "uuid",
  "plantSiteId": "uuid",
  "managerId": "uuid",
  "phone": "string",
  "jobTitle": "string"
}
```

### UserStatusRequest

```json
{
  "isActive": true,
  "isLocked": false,
  "reason": "string"
}
```

### AssignRolesRequest

```json
{
  "roleIds": ["uuid (required)"],
  "plantSiteId": "uuid"
}
```

### ChangePasswordRequest

```json
{
  "currentPassword": "string",
  "newPassword": "string (required)"
}
```

### CreateRoleRequest

```json
{
  "name": "string (required)",
  "code": "string (required)",
  "description": "string",
  "roleLevel": "string (required)",
  "permissionIds": ["uuid"]
}
```

### CreateSecurityProfileRequest

```json
{
  "name": "string (required)",
  "description": "string",
  "permissionIds": ["uuid"]
}
```

### CreateDeviationRequest

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "type": "string (required)",
  "category": "string (required)",
  "occurredDate": "2026-06-21T12:00:00Z (required)",
  "detectedDate": "2026-06-21T12:00:00Z (required)",
  "targetClosureDate": "2026-06-21T12:00:00Z (required)",
  "plantSiteId": "uuid (required)",
  "departmentId": "uuid (required)",
  "area": "string",
  "equipment": "string",
  "product": "string",
  "batchNumber": "string",
  "batchSize": "string",
  "affectedBatches": ["string"],
  "gmpImpact": true,
  "patientSafetyImpact": false,
  "regulatoryImpact": false,
  "sourceArea": "string"
}
```

### UpdateDeviationRequest

```json
{
  "title": "string",
  "description": "string",
  "type": "string",
  "category": "string",
  "targetClosureDate": "2026-06-21T12:00:00Z",
  "assignedToId": "uuid",
  "area": "string",
  "equipment": "string",
  "product": "string",
  "batchNumber": "string",
  "gmpImpact": true,
  "patientSafetyImpact": false,
  "regulatoryImpact": false
}
```

### ClassifyDeviationRequest

```json
{
  "classification": "string (required)",
  "comments": "string"
}
```

### AssignInvestigatorRequest

```json
{
  "assignedToId": "uuid (required)",
  "comments": "string"
}
```

### SubmitInvestigationRequest

```json
{
  "investigatorId": "uuid (required)",
  "probableCause": "string",
  "rootCause": "string",
  "immediateActions": ["string"],
  "findings": "string",
  "conclusion": "string",
  "method": "string"
}
```

### SubmitImpactAssessmentRequest

```json
{
  "productQualityImpact": "string (required)",
  "patientSafetyImpact": "string (required)",
  "regulatoryImpact": "string (required)",
  "businessImpact": "string (required)",
  "overallRiskLevel": "string (required)",
  "affectedProducts": ["string"],
  "affectedBatches": ["string"],
  "batchDisposition": "string",
  "justification": "string (required)"
}
```

### SubmitDispositionRequest

```json
{
  "decision": "string (required)",
  "justification": "string (required)",
  "conditions": "string",
  "qaReviewComments": "string",
  "electronicSignature": {
    "password": "string (required)",
    "meaning": "string (required)"
  }
}
```

### StatusTransitionRequest

```json
{
  "status": "string (required)",
  "comments": "string",
  "electronicSignature": {
    "password": "string (required)",
    "meaning": "string (required)"
  }
}
```

### CreateCapaRequest

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "type": "string (required)",
  "priority": "string (required)",
  "sourceType": "string (required)",
  "sourceReference": "string",
  "targetCompletionDate": "2026-06-21T12:00:00Z (required)",
  "ownerId": "uuid (required)",
  "departmentId": "uuid (required)",
  "plantSiteId": "uuid (required)",
  "product": "string",
  "batchNumber": "string",
  "deviationId": "uuid"
}
```

### UpdateCapaRequest

```json
{
  "title": "string",
  "description": "string",
  "type": "string",
  "priority": "string",
  "targetCompletionDate": "2026-06-21T12:00:00Z",
  "ownerId": "uuid",
  "product": "string",
  "batchNumber": "string"
}
```

### SubmitRcaRequest

```json
{
  "method": "string (required)",
  "description": "string (required)",
  "rootCauses": ["string"],
  "contributingFactors": ["string"],
  "fiveWhyEntries": [
    {
      "level": 1,
      "question": "string",
      "answer": "string"
    }
  ],
  "fishboneCategories": [
    {
      "categoryName": "string",
      "causes": ["string"]
    }
  ]
}
```

### SubmitRiskAssessmentRequest

```json
{
  "severity": "integer 1-5 (required)",
  "occurrence": "integer 1-5 (required)",
  "detection": "integer 1-5 (required)",
  "riskLevel": "string (required)",
  "justification": "string (required)"
}
```

### CreateCapaActionRequest

```json
{
  "description": "string (required)",
  "type": "string (required)",
  "assignedToId": "uuid (required)",
  "dueDate": "2026-06-21T12:00:00Z (required)"
}
```

### UpdateCapaActionRequest

```json
{
  "description": "string",
  "status": "string",
  "assignedToId": "uuid",
  "dueDate": "2026-06-21T12:00:00Z"
}
```

### CompleteActionRequest

```json
{
  "evidence": "string (required)",
  "completedDate": "2026-06-21T12:00:00Z"
}
```

### VerifyActionRequest

```json
{
  "verificationComments": "string",
  "electronicSignature": {
    "password": "string (required)",
    "meaning": "string (required)"
  }
}
```

### SubmitEffectivenessCheckRequest

```json
{
  "criteria": "string (required)",
  "checkDate": "2026-06-21T12:00:00Z (required)",
  "result": "string (required)",
  "evidence": "string (required)",
  "comments": "string",
  "requiresRecurrence": false,
  "recurrenceMonths": 3,
  "electronicSignature": {
    "password": "string (required)",
    "meaning": "string (required)"
  }
}
```

### ApproveRejectRequest

```json
{
  "comments": "string",
  "electronicSignature": {
    "password": "string (required)",
    "meaning": "string (required)"
  }
}
```

### CreateChangeRequestRequest

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "justification": "string (required)",
  "type": "string (required)",
  "category": "string (required)",
  "classification": "string (required)",
  "priority": "string (required)",
  "departmentId": "uuid (required)",
  "changeOwnerId": "uuid (required)",
  "plantSiteId": "uuid (required)",
  "targetImplementationDate": "2026-06-21T12:00:00Z (required)",
  "affectedAreas": ["string"],
  "validationRequired": false,
  "trainingRequired": false,
  "relatedDeviations": ["string"],
  "relatedCapas": ["string"]
}
```

### UpdateChangeRequestRequest

```json
{
  "title": "string",
  "description": "string",
  "justification": "string",
  "type": "string",
  "category": "string",
  "classification": "string",
  "priority": "string",
  "changeOwnerId": "uuid",
  "targetImplementationDate": "2026-06-21T12:00:00Z",
  "affectedAreas": ["string"],
  "validationRequired": false,
  "trainingRequired": false
}
```

### SubmitChangeImpactRequest

```json
{
  "productQuality": "string (required)",
  "patientSafety": "string (required)",
  "regulatoryCompliance": "string (required)",
  "validationStatus": "string (required)",
  "documentation": "string (required)",
  "training": "string (required)",
  "supplierQualification": "string (required)",
  "stability": "string (required)",
  "overallRiskLevel": "string (required)",
  "assessmentSummary": "string (required)"
}
```

### AddAffectedDocumentRequest

```json
{
  "documentNumber": "string (required)",
  "documentTitle": "string (required)",
  "documentType": "string",
  "currentVersion": "string",
  "action": "string (required)",
  "newVersion": "string"
}
```

### AddAffectedProductRequest

```json
{
  "productName": "string (required)",
  "productCode": "string (required)",
  "dosageForm": "string",
  "markets": ["string"],
  "impactDescription": "string"
}
```

### AddImplementationTaskRequest

```json
{
  "title": "string (required)",
  "description": "string",
  "assignedToId": "uuid (required)",
  "departmentId": "uuid",
  "dueDate": "2026-06-21T12:00:00Z (required)"
}
```

### UpdateImplementationTaskRequest

```json
{
  "status": "string",
  "comments": "string",
  "completedDate": "2026-06-21T12:00:00Z"
}
```

### AddTrainingRequirementRequest

```json
{
  "trainingTitle": "string (required)",
  "targetAudience": "string",
  "departmentId": "uuid",
  "trainingType": "string (required)",
  "dueDate": "2026-06-21T12:00:00Z (required)"
}
```

### AddApproverRequest

```json
{
  "approverId": "uuid (required)",
  "role": "string",
  "department": "string",
  "approvalOrder": 1
}
```

### SubmitApprovalDecisionRequest

```json
{
  "decision": "string (required)",
  "comments": "string",
  "electronicSignature": {
    "password": "string (required)",
    "meaning": "string (required)"
  }
}
```

### SubmitEffectivenessReviewRequest

```json
{
  "reviewDate": "2026-06-21T12:00:00Z (required)",
  "overallEffective": true,
  "summary": "string (required)",
  "followUpRequired": false,
  "followUpActions": "string",
  "criteria": [
    {
      "criterion": "string",
      "met": true,
      "evidence": "string"
    }
  ]
}
```

### UpdateConfigRequest

```json
{
  "configValue": "string (required)",
  "configType": "string",
  "description": "string"
}
```

### CreateDepartmentRequest

```json
{
  "plantSiteId": "uuid (required)",
  "name": "string (required)",
  "code": "string (required)",
  "description": "string",
  "parentDepartmentId": "uuid"
}
```

### AdvancedSearchRequest

```json
{
  "query": "string",
  "recordTypes": ["string"],
  "filters": {
    "status": ["string"]
  },
  "dateFrom": "2026-06-21T00:00:00Z",
  "dateTo": "2026-06-21T23:59:59Z",
  "page": 0,
  "size": 20
}
```

### VerifyESignatureRequest

```json
{
  "password": "string (required)",
  "meaning": "string (required)",
  "recordType": "string (required)",
  "recordId": "uuid (required)",
  "action": "string (required)"
}
```

## Response JSON Schemas

### AuthResponse

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "displayName": "string",
    "roles": ["string"]
  }
}
```

### UserResponse

```json
{
  "id": "uuid",
  "employeeId": "string",
  "username": "string",
  "email": "user@example.com",
  "firstName": "string",
  "lastName": "string",
  "displayName": "string",
  "phone": "string",
  "jobTitle": "string",
  "userType": "string",
  "organizationId": "uuid",
  "organizationName": "string",
  "plantSiteId": "uuid",
  "plantSiteName": "string",
  "departmentId": "uuid",
  "departmentName": "string",
  "managerId": "uuid",
  "managerName": "string",
  "isActive": true,
  "isLocked": false,
  "lastLoginAt": "2026-06-21T12:00:00Z",
  "roles": ["RoleResponse"],
  "securityProfiles": ["SecurityProfileResponse"],
  "createdAt": "2026-06-21T12:00:00Z",
  "updatedAt": "2026-06-21T12:00:00Z"
}
```

### RoleResponse, PermissionResponse, SecurityProfileResponse

```json
{
  "role": {
    "id": "uuid",
    "name": "string",
    "code": "string",
    "description": "string",
    "roleLevel": "string",
    "isSystem": false,
    "isActive": true,
    "permissions": ["PermissionResponse"]
  },
  "permission": {
    "id": "uuid",
    "module": "string",
    "action": "string",
    "resource": "string",
    "description": "string"
  },
  "securityProfile": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "isSystem": false
  }
}
```

### DeviationResponse

```json
{
  "id": "uuid",
  "deviationNumber": "string",
  "title": "string",
  "description": "string",
  "type": "string",
  "category": "string",
  "classification": "string",
  "status": "string",
  "sourceArea": "string",
  "occurredDate": "2026-06-21T12:00:00Z",
  "reportedDate": "2026-06-21T12:00:00Z",
  "detectedDate": "2026-06-21T12:00:00Z",
  "targetClosureDate": "2026-06-21T12:00:00Z",
  "actualClosureDate": "2026-06-21T12:00:00Z",
  "reportedBy": "UserRef",
  "assignedTo": "UserRef",
  "reviewer": "UserRef",
  "approvedBy": "UserRef",
  "plantSiteId": "uuid",
  "plantSiteName": "string",
  "departmentId": "uuid",
  "departmentName": "string",
  "area": "string",
  "equipment": "string",
  "product": "string",
  "batchNumber": "string",
  "batchSize": "string",
  "gmpImpact": true,
  "patientSafetyImpact": false,
  "regulatoryImpact": false,
  "capaRequired": false,
  "capaId": "uuid",
  "capaNumber": "string",
  "currentWorkflowStep": "string",
  "affectedBatches": ["AffectedBatchResponse"],
  "investigation": "InvestigationResponse",
  "impactAssessment": "ImpactAssessmentResponse",
  "disposition": "DispositionResponse",
  "createdAt": "2026-06-21T12:00:00Z",
  "updatedAt": "2026-06-21T12:00:00Z",
  "version": 1
}
```

### CapaResponse

```json
{
  "id": "uuid",
  "capaNumber": "string",
  "title": "string",
  "description": "string",
  "type": "string",
  "status": "string",
  "priority": "string",
  "sourceType": "string",
  "sourceReference": "string",
  "initiatedDate": "2026-06-21T12:00:00Z",
  "targetCompletionDate": "2026-06-21T12:00:00Z",
  "actualCompletionDate": "2026-06-21T12:00:00Z",
  "dueDate": "2026-06-21T12:00:00Z",
  "initiator": "UserRef",
  "owner": "UserRef",
  "departmentId": "uuid",
  "departmentName": "string",
  "plantSiteId": "uuid",
  "plantSiteName": "string",
  "product": "string",
  "batchNumber": "string",
  "deviationId": "uuid",
  "deviationNumber": "string",
  "currentWorkflowStep": "string",
  "rootCauseAnalysis": "RcaResponse",
  "riskAssessment": "RiskAssessmentResponse",
  "actions": ["CapaActionResponse"],
  "effectivenessChecks": ["EffectivenessCheckResponse"],
  "createdAt": "2026-06-21T12:00:00Z",
  "updatedAt": "2026-06-21T12:00:00Z",
  "version": 1
}
```

### ChangeRequestResponse

```json
{
  "id": "uuid",
  "changeNumber": "string",
  "title": "string",
  "description": "string",
  "justification": "string",
  "type": "string",
  "category": "string",
  "classification": "string",
  "status": "string",
  "priority": "string",
  "requestedBy": "UserRef",
  "requestedDate": "2026-06-21T12:00:00Z",
  "departmentId": "uuid",
  "departmentName": "string",
  "changeOwner": "UserRef",
  "qaReviewer": "UserRef",
  "raReviewer": "UserRef",
  "plantSiteId": "uuid",
  "plantSiteName": "string",
  "affectedAreas": ["string"],
  "targetImplementationDate": "2026-06-21T12:00:00Z",
  "actualImplementationDate": "2026-06-21T12:00:00Z",
  "effectivenessCheckDate": "2026-06-21T12:00:00Z",
  "closedDate": "2026-06-21T12:00:00Z",
  "regulatoryFilingRequired": false,
  "validationRequired": false,
  "validationDetails": "string",
  "trainingRequired": false,
  "relatedDeviations": ["string"],
  "relatedCapas": ["string"],
  "relatedChanges": ["string"],
  "currentWorkflowStep": "string",
  "impactAssessment": "ChangeImpactResponse",
  "regulatoryFiling": "RegulatoryFilingResponse",
  "affectedDocuments": ["AffectedDocumentResponse"],
  "affectedProducts": ["AffectedProductResponse"],
  "implementationTasks": ["ImplementationTaskResponse"],
  "trainingRequirements": ["TrainingRequirementResponse"],
  "approvals": ["ChangeApprovalResponse"],
  "effectivenessReviews": ["EffectivenessReviewResponse"],
  "createdAt": "2026-06-21T12:00:00Z",
  "updatedAt": "2026-06-21T12:00:00Z",
  "version": 1
}
```

### Frequently Used Nested Responses

```json
{
  "userRef": {
    "id": "uuid",
    "displayName": "string",
    "email": "user@example.com"
  },
  "auditTrail": {
    "id": "uuid",
    "recordType": "string",
    "recordId": "uuid",
    "recordNumber": "string",
    "action": "string",
    "fieldName": "string",
    "oldValue": "string",
    "newValue": "string",
    "comments": "string",
    "reasonForChange": "string",
    "userId": "uuid",
    "userName": "string",
    "ipAddress": "string",
    "timestamp": "2026-06-21T12:00:00Z"
  },
  "workflowHistory": {
    "id": "uuid",
    "stepName": "string",
    "status": "string",
    "assignedTo": "UserRef",
    "startedAt": "2026-06-21T12:00:00Z",
    "completedAt": "2026-06-21T12:00:00Z",
    "comments": "string",
    "stepOrder": 1
  }
}
```

### CAPA Nested Responses

```json
{
  "rootCauseAnalysis": {
    "id": "uuid",
    "method": "string",
    "description": "string",
    "rootCauses": ["string"],
    "contributingFactors": ["string"],
    "fiveWhyEntries": [
      {
        "level": 1,
        "question": "string",
        "answer": "string"
      }
    ],
    "fishboneCategories": [
      {
        "categoryName": "string",
        "causes": ["string"]
      }
    ],
    "completedDate": "2026-06-21T12:00:00Z",
    "completedBy": "UserRef"
  },
  "riskAssessment": {
    "id": "uuid",
    "severity": 4,
    "occurrence": 3,
    "detection": 2,
    "rpn": 24,
    "riskLevel": "string",
    "justification": "string",
    "assessedBy": "UserRef",
    "assessedDate": "2026-06-21T12:00:00Z"
  },
  "capaAction": {
    "id": "uuid",
    "actionNumber": "string",
    "description": "string",
    "type": "string",
    "status": "string",
    "assignedTo": "UserRef",
    "dueDate": "2026-06-21T12:00:00Z",
    "completedDate": "2026-06-21T12:00:00Z",
    "evidence": "string",
    "verifiedBy": "UserRef",
    "verifiedDate": "2026-06-21T12:00:00Z",
    "verificationComments": "string"
  },
  "effectivenessCheck": {
    "id": "uuid",
    "criteria": "string",
    "checkDate": "2026-06-21T12:00:00Z",
    "result": "string",
    "evidence": "string",
    "verifiedBy": "UserRef",
    "comments": "string",
    "requiresRecurrence": false,
    "recurrenceMonths": 3,
    "nextCheckDate": "2026-06-21T12:00:00Z",
    "checkNumber": 1
  }
}
```

### Deviation Nested Responses

```json
{
  "affectedBatch": {
    "id": "uuid",
    "batchNumber": "string",
    "productName": "string",
    "batchSize": "string",
    "impactDescription": "string",
    "disposition": "string"
  },
  "investigation": {
    "id": "uuid",
    "investigator": "UserRef",
    "startDate": "2026-06-21T12:00:00Z",
    "completedDate": "2026-06-21T12:00:00Z",
    "probableCause": "string",
    "rootCause": "string",
    "findings": "string",
    "conclusion": "string",
    "method": "string",
    "immediateActions": ["string"]
  },
  "impactAssessment": {
    "id": "uuid",
    "productQualityImpact": "string",
    "patientSafetyImpact": "string",
    "regulatoryImpact": "string",
    "businessImpact": "string",
    "overallRiskLevel": "string",
    "affectedProducts": ["string"],
    "affectedBatches": ["string"],
    "batchDisposition": "string",
    "justification": "string",
    "assessedBy": "UserRef",
    "assessedDate": "2026-06-21T12:00:00Z"
  },
  "disposition": {
    "id": "uuid",
    "decision": "string",
    "justification": "string",
    "conditions": "string",
    "approvedBy": "UserRef",
    "approvedDate": "2026-06-21T12:00:00Z",
    "qaReviewComments": "string"
  }
}
```

### Change Request Nested Responses

```json
{
  "changeImpact": {
    "id": "uuid",
    "productQuality": "string",
    "patientSafety": "string",
    "regulatoryCompliance": "string",
    "validationStatus": "string",
    "documentation": "string",
    "training": "string",
    "supplierQualification": "string",
    "stability": "string",
    "overallRiskLevel": "string",
    "assessmentSummary": "string",
    "assessedBy": "UserRef",
    "assessedDate": "2026-06-21T12:00:00Z"
  },
  "affectedDocument": {
    "id": "uuid",
    "documentNumber": "string",
    "documentTitle": "string",
    "documentType": "string",
    "currentVersion": "string",
    "action": "string",
    "newVersion": "string",
    "status": "string"
  },
  "affectedProduct": {
    "id": "uuid",
    "productName": "string",
    "productCode": "string",
    "dosageForm": "string",
    "markets": ["string"],
    "impactDescription": "string"
  },
  "implementationTask": {
    "id": "uuid",
    "taskNumber": 1,
    "title": "string",
    "description": "string",
    "assignedTo": "UserRef",
    "departmentName": "string",
    "dueDate": "2026-06-21T12:00:00Z",
    "completedDate": "2026-06-21T12:00:00Z",
    "status": "string",
    "comments": "string"
  },
  "trainingRequirement": {
    "id": "uuid",
    "trainingTitle": "string",
    "targetAudience": "string",
    "departmentName": "string",
    "trainingType": "string",
    "dueDate": "2026-06-21T12:00:00Z",
    "completionStatus": "string",
    "completionPercentage": 0
  },
  "approval": {
    "id": "uuid",
    "approver": "UserRef",
    "role": "string",
    "department": "string",
    "decision": "string",
    "comments": "string",
    "decisionDate": "2026-06-21T12:00:00Z",
    "approvalOrder": 1
  },
  "effectivenessReview": {
    "id": "uuid",
    "reviewDate": "2026-06-21T12:00:00Z",
    "reviewer": "UserRef",
    "overallEffective": true,
    "summary": "string",
    "followUpRequired": false,
    "followUpActions": "string",
    "criteria": [
      {
        "id": "uuid",
        "criterion": "string",
        "met": true,
        "evidence": "string"
      }
    ]
  }
}
```

### Attachment, Notification, Lookup Responses

```json
{
  "attachment": {
    "id": "uuid",
    "recordType": "string",
    "recordId": "uuid",
    "fileName": "string",
    "fileType": "string",
    "fileSize": 1000,
    "category": "string",
    "description": "string",
    "uploadedBy": "UserRef",
    "uploadedDate": "2026-06-21T12:00:00Z",
    "downloadUrl": "string"
  },
  "notification": {
    "id": "uuid",
    "title": "string",
    "message": "string",
    "notificationType": "string",
    "recordType": "string",
    "recordId": "uuid",
    "recordNumber": "string",
    "isRead": false,
    "readAt": "2026-06-21T12:00:00Z",
    "priority": "string",
    "createdAt": "2026-06-21T12:00:00Z"
  },
  "lookupValue": {
    "id": "uuid",
    "category": "string",
    "code": "string",
    "displayValue": "string",
    "description": "string",
    "sortOrder": 1
  }
}
```

### Dashboard Responses

```json
{
  "dashboard": {
    "openCapas": 0,
    "openDeviations": 0,
    "openChangeRequests": 0,
    "overdueCapas": 0,
    "overdueDeviations": 0,
    "overdueChangeRequests": 0,
    "pendingReviews": 0,
    "capasByStatus": {
      "OPEN": 0
    },
    "deviationsByStatus": {
      "OPEN": 0
    },
    "changeRequestsByStatus": {
      "OPEN": 0
    }
  },
  "capaMetrics": {
    "totalCapas": 0,
    "openCapas": 0,
    "overdueCapas": 0,
    "closedCapas": 0,
    "byStatus": {},
    "byPriority": {},
    "byDepartment": {}
  },
  "deviationMetrics": {
    "totalDeviations": 0,
    "openDeviations": 0,
    "overdueDeviations": 0,
    "closedDeviations": 0,
    "byStatus": {},
    "byClassification": {},
    "byCategory": {},
    "byDepartment": {}
  },
  "changeControlMetrics": {
    "totalChangeRequests": 0,
    "openChangeRequests": 0,
    "overdueChangeRequests": 0,
    "closedChangeRequests": 0,
    "byStatus": {},
    "byType": {},
    "byClassification": {},
    "byDepartment": {}
  }
}
```

### Administration Entity Responses

These endpoints currently return JPA entities directly.

```json
{
  "systemConfiguration": {
    "id": "uuid",
    "configKey": "string",
    "configValue": "string",
    "configType": "STRING",
    "module": "string",
    "plantSite": "PlantSite",
    "description": "string",
    "isEncrypted": false,
    "updatedAt": "2026-06-21T12:00:00Z",
    "updatedBy": "User"
  },
  "organization": {
    "id": "uuid",
    "name": "string",
    "code": "string",
    "type": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "phone": "string",
    "email": "string",
    "gmpCertification": "string",
    "licenseNumber": "string",
    "isActive": true,
    "createdAt": "2026-06-21T12:00:00Z",
    "updatedAt": "2026-06-21T12:00:00Z"
  },
  "plantSite": {
    "id": "uuid",
    "organization": "Organization",
    "name": "string",
    "code": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "siteType": "string",
    "fdaRegistration": "string",
    "isActive": true,
    "createdAt": "2026-06-21T12:00:00Z",
    "updatedAt": "2026-06-21T12:00:00Z"
  },
  "department": {
    "id": "uuid",
    "plantSite": "PlantSite",
    "name": "string",
    "code": "string",
    "description": "string",
    "parentDepartment": "Department",
    "isActive": true,
    "createdAt": "2026-06-21T12:00:00Z",
    "updatedAt": "2026-06-21T12:00:00Z"
  },
  "product": {
    "id": "uuid",
    "productCode": "string",
    "productName": "string",
    "dosageForm": "string",
    "strength": "string",
    "therapeuticCategory": "string",
    "plantSite": "PlantSite",
    "isActive": true,
    "createdAt": "2026-06-21T12:00:00Z",
    "updatedAt": "2026-06-21T12:00:00Z"
  },
  "batch": {
    "id": "uuid",
    "batchNumber": "string",
    "product": "Product",
    "batchSize": "string",
    "manufacturingDate": "2026-06-21",
    "expiryDate": "2026-06-21",
    "status": "IN_PROCESS",
    "plantSite": "PlantSite",
    "createdAt": "2026-06-21T12:00:00Z"
  },
  "electronicSignature": {
    "id": "uuid",
    "user": "User",
    "recordType": "string",
    "recordId": "uuid",
    "action": "string",
    "meaning": "string",
    "signatureHash": "string",
    "signedAt": "2026-06-21T12:00:00Z",
    "ipAddress": "string",
    "comments": "string",
    "isValid": true,
    "invalidatedAt": "2026-06-21T12:00:00Z",
    "invalidatedBy": "User",
    "invalidationReason": "string"
  }
}
```
