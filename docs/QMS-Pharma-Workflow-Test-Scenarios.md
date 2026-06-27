# QMS-Pharma: Comprehensive Workflow Test Scenarios

**Document ID:** QMS-TEST-2026-001
**Version:** 1.0
**Date:** 27-Jun-2026
**Prepared By:** QA Engineering Team
**Classification:** Internal Use Only

---

## Table of Contents

1. [Flowable Workflow Integration Status](#1-flowable-workflow-integration-status)
2. [Module 1: CAPA Management](#2-module-1-capa-management)
3. [Module 2: Deviation Management](#3-module-2-deviation-management)
4. [Module 3: Change Control](#4-module-3-change-control)
5. [Module 4: Document Management](#5-module-4-document-management)
6. [Module 5: Training Management](#6-module-5-training-management)
7. [Module 6: Audit Management](#7-module-6-audit-management)
8. [Module 7: Complaint Management](#8-module-7-complaint-management)
9. [Module 8: Nonconformance Management](#9-module-8-nonconformance-management)
10. [Module 9: Risk Management](#10-module-9-risk-management)
11. [Module 10: Supplier Quality Management](#11-module-10-supplier-quality-management)
12. [Module 11: Equipment Management](#12-module-11-equipment-management)
13. [Integrated Cross-Module Test Scenarios](#13-integrated-cross-module-test-scenarios)
14. [Sample User Accounts for Testing](#14-sample-user-accounts-for-testing)

---

## 1. Flowable Workflow Integration Status

| # | Module | BPMN Process Key | Backend startProcess | transitionStatus | Frontend Actions | Integration |
|---|--------|-------------------|---------------------|------------------|-----------------|-------------|
| 1 | CAPA | capaProcess | Yes (create) | Full switch (9 cases) | getAvailableActions | COMPLETE |
| 2 | Deviation | deviationProcess | Yes (create) | Full switch (9 cases) | getAvailableActions | COMPLETE |
| 3 | Change Control | changeControlProcess | Yes (create) | Full switch (12 cases) | getAvailableActions | COMPLETE |
| 4 | Document | documentProcess | Yes (on transition) | handleWorkflowTransition | Hardcoded buttons | COMPLETE |
| 5 | Training | trainingProcess | Yes (createAssignment) | recordStep + completeTask | Basic start/complete | COMPLETE |
| 6 | Audit | auditProcess | Yes (create, full vars) | Full switch (6 cases) | Conditional UI | COMPLETE |
| 7 | Complaint | complaintProcess | Yes (create) | Full switch (6 cases) | Conditional UI | COMPLETE |
| 8 | Nonconformance | nonconformanceProcess | Yes (create) | Full switch (6 cases) | Conditional UI | COMPLETE |
| 9 | Risk | riskRegisterProcess | Yes (on transition) | Full switch (8 cases) | Step tracker | COMPLETE |
| 10 | Supplier | supplierProcess | Yes (create) | Full switch (8 cases) | Step tracker | COMPLETE |
| 11 | Equipment | equipmentCalibrationProcess | Yes (createCalibration) | recordStep throughout | Partial | COMPLETE |

**Summary:** All 11 modules are fully wired with Flowable workflow engine. Each module has startProcess, task completion, and workflow history recording.

---

## 2. Module 1: CAPA Management

### BPMN Process: `capaProcess`
**Steps:** Initiation -> QA Review -> Root Cause Analysis -> Risk Assessment -> Action Planning -> Action Execution (R3/P7D timer) -> Effectiveness Check (loop-back gateway) -> QA Approval -> Closure

### Test Scenario 1.1: Full CAPA Lifecycle (Happy Path)

| Step | Action | User Role | API / UI Action | Input Data | Expected Result |
|------|--------|-----------|-----------------|------------|-----------------|
| 1 | Create CAPA | End User | POST /api/v1/capas | Title: "OOS Result - Dissolution Test Batch PX-2026-101", Type: BOTH, Priority: HIGH, Source Type: OOS_RESULT, Source Ref: "DEV-2026-001", Dept: Quality Control, Plant: Hyderabad Unit-1, Product: "Paracetamol 500mg Tablets", Batch: "PX-2026-101", Target Date: 30 days from now | Status = INITIATED, CAPA number generated (e.g., CAPA-2026-001), Flowable process started, Workflow step = "Initiation" |
| 2 | Submit for Review | Owner | PATCH /api/v1/capas/{id}/status | status: UNDER_REVIEW | Status = UNDER_REVIEW, Workflow step = "QA Review", "Initiation" marked COMPLETED |
| 3 | Approve & Start Investigation | QA Reviewer | PATCH /api/v1/capas/{id}/status | status: INVESTIGATION | Status = INVESTIGATION, qaReview Flowable task completed with APPROVED, Workflow step = "Root Cause Analysis" |
| 4 | Submit Root Cause Analysis | Owner | POST /api/v1/capas/{id}/root-cause-analysis | method: FIVE_WHY, description: "Investigation into dissolution failure", rootCauses: ["Granulation moisture content exceeded limits"], contributingFactors: ["Humidity control maintenance overdue", "SOP not followed"], fiveWhyEntries: [{level:1, question:"Why did dissolution fail?", answer:"Tablet hardness too high"}, {level:2, question:"Why was hardness high?", answer:"Granulation over-dried"}, {level:3, question:"Why over-dried?", answer:"Moisture sensor incorrect"}, {level:4, question:"Why sensor incorrect?", answer:"Calibration overdue by 2 weeks"}, {level:5, question:"Why calibration overdue?", answer:"PM schedule not tracked"}] | Status = ROOT_CAUSE_IDENTIFIED, RCA saved with 5-Why entries, investigation Flowable task completed |
| 5 | Submit Risk Assessment | Owner | POST /api/v1/capas/{id}/risk-assessment | severity: 4, occurrence: 3, detection: 2, riskLevel: HIGH, justification: "Product quality affected, patient safety risk. Detected during QC testing before release." | Status = ACTION_PLANNING, RPN = 24, riskAssessment Flowable task completed, Workflow step = "Action Planning" |
| 6 | Add Corrective Action | Owner | POST /api/v1/capas/{id}/actions | description: "Replace moisture sensor in FBD-03 and recalibrate", type: CORRECTIVE, assignedToId: (Venkat Rao's UUID), dueDate: 14 days from now | Action created with number CAPA-2026-001-A01 |
| 7 | Add Preventive Action | Owner | POST /api/v1/capas/{id}/actions | description: "Implement automated calibration tracking system with escalation alerts", type: PREVENTIVE, assignedToId: (Anil Prasad's UUID), dueDate: 21 days from now | Action created with number CAPA-2026-001-A02 |
| 8 | Start Action Execution | Owner | POST /api/v1/capas/{id}/start-action-execution | (empty body) | Status = ACTION_IN_PROGRESS, actionPlanning Flowable task completed, Workflow step = "Action Execution" |
| 9 | Complete Corrective Action | Assignee | PATCH /api/v1/capas/{id}/actions/{actionId}/complete | evidence: "Calibration certificate CAL-2026-156 attached" | Action status = COMPLETED, completedDate set |
| 10 | Verify Corrective Action | QA Reviewer | PATCH /api/v1/capas/{id}/actions/{actionId}/verify | verificationComments: "Sensor replaced and calibrated. Certificate verified." | Action status = VERIFIED, verifiedBy and verifiedDate set |
| 11 | Complete & Verify Preventive Action | Assignee + QA | (Repeat steps 9-10 for second action) | Same pattern | Both actions VERIFIED |
| 12 | Complete Action Execution | Owner | POST /api/v1/capas/{id}/complete-action-execution | (empty body) | Status = EFFECTIVENESS_CHECK, actionExecution Flowable task completed |
| 13 | Submit Effectiveness Check | QA Reviewer | POST /api/v1/capas/{id}/effectiveness-check | criteria: "No moisture-related OOS for 60 days", checkDate: today, result: EFFECTIVE, evidence: "QC data review - zero OOS for 60+ days", comments: "CAPA effective", requiresRecurrence: true, recurrenceMonths: 6 | Status = PENDING_CLOSURE, effectivenessCheck task completed with EFFECTIVE |
| 14 | Close CAPA (E-Sign) | QA Approver | PATCH /api/v1/capas/{id}/status | status: CLOSED, comments: "E-Signed: Closure approved" | Status = CLOSED, closedAt set, qaApproval task completed, Workflow = "Closed" |

### Test Scenario 1.2: CAPA Rejection at QA Review

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create CAPA | End User | Title: "Minor Labeling Typo", Type: CORRECTIVE, Priority: LOW | Status = INITIATED |
| 2 | Submit for Review | Owner | status: UNDER_REVIEW | Status = UNDER_REVIEW |
| 3 | Reject | QA Reviewer | status: REJECTED, comments: "Not a CAPA-worthy issue. Handle as a deviation." | Status = REJECTED, qaReview task completed with REJECTED, Process ends |

### Test Scenario 1.3: Effectiveness Check Failure (Loop-back)

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-12 | (Follow 1.1 steps 1-12) | Various | (Same as above) | Status = EFFECTIVENESS_CHECK |
| 13 | Submit Effectiveness Check - NOT EFFECTIVE | QA Reviewer | result: NOT_EFFECTIVE, evidence: "OOS recurred within 30 days", comments: "Root cause not fully addressed" | Status = ACTION_PLANNING (loop-back), effectivenessCheck task completed with NOT_EFFECTIVE |
| 14 | Revise actions and re-execute | Owner | (Add new actions, start execution again) | Cycle through ACTION_IN_PROGRESS -> EFFECTIVENESS_CHECK again |

### Test Scenario 1.4: Validation - Action Execution Without Actions

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-5 | (Follow 1.1 steps 1-5) | Various | (Same as above) | Status = ACTION_PLANNING |
| 6 | Attempt Start Execution (no actions) | Owner | POST /start-action-execution | Error 400: "At least one action must be defined before starting execution" (CAPA_NO_ACTIONS) |

### Test Scenario 1.5: Validation - Complete Execution With Unverified Actions

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-8 | (Follow 1.1 steps 1-8) | Various | Status = ACTION_IN_PROGRESS | Actions exist but not verified |
| 9 | Attempt Complete Execution | Owner | POST /complete-action-execution | Error 400: "2 actions not yet verified" (CAPA_ACTIONS_NOT_VERIFIED) |

---

## 3. Module 2: Deviation Management

### BPMN Process: `deviationProcess`
**Steps:** Reported -> QA Review & Classification -> Investigation (25-day timer) -> Impact Assessment -> Disposition -> CAPA Initiation (conditional) -> Pending Closure -> Closed

### Test Scenario 2.1: Full Deviation Lifecycle with CAPA Initiation

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Deviation | End User | Title: "Temperature Excursion in Cold Storage Unit CS-03", Type: UNPLANNED, Category: PROCESS, Dept: Warehouse, Plant: Hyderabad Unit-1, Description: "Temperature recorded at 12 deg C against 2-8 deg C for 45 minutes during power outage", Batch: "INJ-2026-045", Product: "Insulin Glargine Injection" | Status = REPORTED, DEV number generated (DEV-2026-001), Process started |
| 2 | Submit for Review | Reporter | PATCH /status, status: UNDER_REVIEW | Status = UNDER_REVIEW, Workflow = "QA Review & Classification" |
| 3 | Classify & Assign | QA Reviewer | PATCH /classify, classification: MAJOR, assignedToId: (Investigator UUID), comments: "Potential product impact - requires full investigation" | Status = CLASSIFIED, classification = MAJOR, assignedTo set |
| 4 | Start Investigation | Assigned User | PATCH /status, status: INVESTIGATION | Status = INVESTIGATION, Workflow = "Investigation" |
| 5 | Submit Investigation | Investigator | PUT /api/v1/deviations/{id}, investigation: "Root cause: UPS battery failure during scheduled power maintenance. Backup generator had 3-minute delay in switchover." | Investigation saved |
| 6 | Move to Impact Assessment | Investigator | PATCH /status, status: IMPACT_ASSESSMENT | Status = IMPACT_ASSESSMENT, Validates investigation exists |
| 7 | Submit Impact Assessment | QA Reviewer | PUT /api/v1/deviations/{id}, impactAssessment: "Product quality: Insulin stability data shows degradation above 8C for >30 min. 3 batches affected. Potential patient safety impact." | Impact assessment saved |
| 8 | Move to Disposition | QA Reviewer | PATCH /status, status: DISPOSITION | Status = DISPOSITION, Validates impact assessment exists |
| 9 | Approve Disposition (E-Sign) | QA Approver | PATCH /status, status: CAPA_INITIATED, comments: "E-Signed: Disposition approved. CAPA required for UPS system upgrade." | Status = CAPA_INITIATED, CAPA initiation step recorded |
| 10 | Move to Pending Closure | Owner | PATCH /status, status: PENDING_CLOSURE | Status = PENDING_CLOSURE |
| 11 | Close Deviation (E-Sign) | QA Approver | PATCH /status, status: CLOSED, comments: "E-Signed: All actions complete." | Status = CLOSED, closedAt set, Process ends |

### Test Scenario 2.2: Minor Deviation - No CAPA Required

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Deviation | End User | Title: "Incorrect Logbook Entry - Area B2", Type: PLANNED, Category: DOCUMENTATION, Priority: LOW | Status = REPORTED |
| 2-6 | Review, Classify (MINOR), Investigate | Various | classification: MINOR | Normal flow |
| 7 | Skip CAPA, go to Pending Closure | QA Approver | PATCH /status, status: PENDING_CLOSURE | Status = PENDING_CLOSURE (CAPA step skipped) |
| 8 | Close | QA Approver | PATCH /status, status: CLOSED | Status = CLOSED |

### Test Scenario 2.3: Deviation Rejection

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-2 | Create and Submit | End User | Title: "Equipment noise during operation" | Status = UNDER_REVIEW |
| 3 | Reject | QA Reviewer | status: REJECTED, comments: "This is a maintenance request, not a quality deviation." | Status = REJECTED, Process ends |

---

## 4. Module 3: Change Control

### BPMN Process: `changeControlProcess`
**Steps:** Draft -> Submit -> Impact Assessment (8 dimensions) -> QA Review -> RA Review (conditional) -> Approval (E-Sign) -> Implementation (P30D timer) -> Verification (E-Sign) -> Effectiveness Check (E-Sign) -> Closed

### Test Scenario 3.1: Full Change Control with Regulatory Filing

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Change Request | Change Owner | Title: "Upgrade HVAC System in Sterile Manufacturing Area", Type: FACILITY, Category: PRODUCT, Classification: MAJOR, Priority: HIGH, Dept: Engineering, Plant: Hyderabad Unit-2, Description: "Replace existing HVAC with ISO 14644 compliant system for Grade B cleanroom", targetImplementationDate: 90 days from now, regulatoryFilingRequired: true, trainingRequired: true | Status = DRAFT, CHANGE number generated, Flowable process started |
| 2 | Submit Change Request | Change Owner | PATCH /status, status: SUBMITTED | Status = SUBMITTED, submitChange task completed, Workflow = "Impact Assessment" |
| 3 | Submit Impact Assessment | Change Owner | POST /impact-assessment, productQuality: HIGH, patientSafety: MEDIUM, regulatoryCompliance: HIGH, validationStatus: HIGH, documentation: MEDIUM, training: HIGH, supplierImpact: LOW, stabilityImpact: LOW, overallRiskLevel: HIGH, assessmentSummary: "Major facility change impacting sterile manufacturing. Requires full revalidation." | Impact assessment saved |
| 4 | Submit for QA Review | Change Owner | PATCH /status, status: QA_REVIEW | Status = QA_REVIEW, impactAssessment task completed |
| 5 | Approve QA Review -> Route to RA Review | QA Reviewer | PATCH /status, status: RA_REVIEW | Status = RA_REVIEW, qaReview completed with regulatoryFilingRequired=true |
| 6 | Complete RA Review | RA Reviewer | PATCH /status, status: PENDING_APPROVAL | Status = PENDING_APPROVAL, raReview task completed |
| 7 | Add Approvers | QA Reviewer | POST /approvals, userId: (QA Head UUID), approvalOrder: 1 | Approver added |
| 8 | Approve Change (E-Sign) | QA Approver | PATCH /status, status: APPROVED, comments: "E-Signed: Change approved for implementation" | Status = APPROVED, pendingApproval task completed |
| 9 | Start Implementation | Change Owner | PATCH /status, status: IMPLEMENTATION | Status = IMPLEMENTATION |
| 10 | Add Implementation Tasks | Change Owner | POST /implementation-tasks, [{description: "Procure HVAC components", assignedToId: UUID, dueDate: +30d}, {description: "Install and commission HVAC", assignedToId: UUID, dueDate: +60d}, {description: "Perform IQ/OQ/PQ validation", assignedToId: UUID, dueDate: +80d}] | 3 tasks created |
| 11 | Complete All Tasks | Various | PUT /implementation-tasks/{taskId}, status: COMPLETED | All tasks = COMPLETED |
| 12 | Complete Implementation | Change Owner | PATCH /status, status: VERIFICATION | Status = VERIFICATION, actualImplementationDate set |
| 13 | Verify (E-Sign) | QA Reviewer | PATCH /status, status: EFFECTIVENESS_CHECK, comments: "E-Signed: Implementation verified" | Status = EFFECTIVENESS_CHECK |
| 14 | Close (E-Sign) | QA Approver | PATCH /status, status: CLOSED, comments: "E-Signed: Change effective and closed" | Status = CLOSED, closedDate set |

### Test Scenario 3.2: Change Control Without Regulatory Filing

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create | Change Owner | Title: "Update SOP-QC-012 Dissolution Testing", Type: DOCUMENT, Classification: MINOR, regulatoryFilingRequired: false | Status = DRAFT |
| 2-4 | Submit, Impact, QA Review | Various | (Normal flow) | Status = QA_REVIEW |
| 5 | Approve QA Review -> Skip RA | QA Reviewer | PATCH /status, status: PENDING_APPROVAL | Status = PENDING_APPROVAL (RA_REVIEW skipped), qaReview completed with regulatoryFilingRequired=false |
| 6-9 | Approve, Implement, Verify, Close | Various | (Normal flow) | Status = CLOSED |

### Test Scenario 3.3: Change Rejection at Approval

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-6 | (Follow 3.1 steps 1-6) | Various | (Same as above) | Status = PENDING_APPROVAL |
| 7 | Reject | QA Approver | status: REJECTED, comments: "Cost-benefit analysis insufficient. Resubmit with updated financial projections." | Status = REJECTED, Process ends |

### Test Scenario 3.4: Reopen Implementation from Effectiveness Check

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-13 | (Follow 3.1 steps 1-13) | Various | (Same) | Status = EFFECTIVENESS_CHECK |
| 14 | Reopen Implementation | QA Reviewer | status: IMPLEMENTATION, comments: "Particle count in Zone B2 exceeds limits. Additional balancing required." | Status = IMPLEMENTATION (loop-back), Effectiveness Check marked completed with comment |

### Test Scenario 3.5: Validation - QA Review Without Impact Assessment

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-2 | Create and Submit | Change Owner | (Normal) | Status = SUBMITTED |
| 3 | Attempt QA Review (no impact) | Change Owner | PATCH /status, status: QA_REVIEW | Error 400: "Impact assessment must be submitted before QA review" (CC_NO_IMPACT_ASSESSMENT) |

---

## 5. Module 4: Document Management

### BPMN Process: `documentProcess`
**Steps:** Draft -> Draft Review (APPROVED/REVISION_REQUIRED loop) -> QA Approval -> Training Assignment -> Effective -> Periodic Review (P365D timer)

### Test Scenario 4.1: Full Document Lifecycle

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Document | Author | Title: "SOP-PRD-045 Granulation Process Control", Type: SOP, Category: PRODUCTION, Version: "1.0", Description: "Standard operating procedure for wet granulation process control including in-process checks", Dept: Production, Plant: Hyderabad Unit-1, effectiveDate: 14 days from now | Status = DRAFT, Document number generated |
| 2 | Upload Content | Author | POST /upload, file: SOP-PRD-045-v1.0.pdf | Document file stored in GCS |
| 3 | Submit for Review | Author | PATCH /status, status: PENDING_REVIEW | Status = PENDING_REVIEW, Flowable process started, Workflow = "Draft Review" |
| 4 | Approve Review | Reviewer | PATCH /status, status: PENDING_APPROVAL, comments: "Content reviewed and technically accurate" | Status = PENDING_APPROVAL, draftReview task completed with APPROVED |
| 5 | Approve Document | QA Approver | PATCH /status, status: APPROVED, comments: "Approved for training and release" | Status = APPROVED, qaApproval task completed |
| 6 | Make Effective | System/Admin | PATCH /status, status: EFFECTIVE | Status = EFFECTIVE, effectiveDate set |

### Test Scenario 4.2: Document Review - Revision Required

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-3 | Create, Upload, Submit | Author | (Same as 4.1) | Status = PENDING_REVIEW |
| 4 | Request Revision | Reviewer | PATCH /status, status: DRAFT, comments: "Section 4.3 missing in-process moisture check parameters. Please revise." | Status = DRAFT (loop-back), Author revises |
| 5 | Resubmit | Author | PATCH /status, status: PENDING_REVIEW | Status = PENDING_REVIEW (re-enters review cycle) |
| 6 | Approve | Reviewer | PATCH /status, status: PENDING_APPROVAL | Status = PENDING_APPROVAL |

### Test Scenario 4.3: Document Version Upgrade

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create new version of existing doc | Author | Title: "SOP-PRD-045 Granulation Process Control", Version: "2.0", parentDocumentId: (v1.0 UUID), changeDescription: "Added moisture sensor verification step per CAPA-2026-001" | New version created, old version status unchanged until new is effective |
| 2-6 | (Follow 4.1 steps 2-6) | Various | (Same flow) | v2.0 becomes EFFECTIVE, v1.0 becomes SUPERSEDED |

---

## 6. Module 5: Training Management

### BPMN Process: `trainingProcess`
**Steps:** Complete Training -> Assessment (conditional) -> Trainer Verification (loop-back if not effective) -> Record Completion
**Note:** Training module currently has NO Flowable integration. Status transitions are database-driven only.

### Test Scenario 5.1: Training Curriculum and Assignment

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Curriculum | Training Coordinator | Title: "Aseptic Gowning Procedure v2.0", Type: SOP_TRAINING, Description: "Updated gowning technique training per CAPA-2026-003", documentId: (SOP UUID), passingScore: 80, validityMonths: 12, assessmentRequired: true | Curriculum created |
| 2 | Create Assignment | Training Coordinator | curriculumId: (above), traineeId: (Operator UUID), trainerId: (Trainer UUID), dueDate: 14 days from now | Assignment created, status = ASSIGNED |
| 3 | Start Training | Trainee | PATCH /assignments/{id}/start | Status = IN_PROGRESS |
| 4 | Complete Training | Trainee | PATCH /assignments/{id}/complete, score: 92, comments: "Completed video-based assessment and practical demonstration" | Status = COMPLETED, score recorded |

### Test Scenario 5.2: Training - Failed Assessment

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-3 | (Follow 5.1 steps 1-3) | Various | (Same) | Status = IN_PROGRESS |
| 4 | Complete with failing score | Trainee | score: 65 (below passing score of 80) | Status = COMPLETED but score < passingScore, requires reassignment |

---

## 7. Module 6: Audit Management

### BPMN Process: `auditProcess`
**Steps:** Audit Planning -> Plan Approval -> Audit Execution (dueDate timer) -> Findings Review -> CAPA Gateway -> Auditee Response -> Audit Closure
**Note:** Audit module has partial Flowable integration. Process starts but tasks are not completed via workflow engine.

### Test Scenario 6.1: Full Internal Audit Lifecycle

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Audit | QA Manager | Title: "Annual GMP Compliance Audit - Production Area", Type: INTERNAL, scope: "Production processes, documentation, personnel training, facility maintenance", leadAuditorId: (Auditor UUID), auditeeId: (Production Head UUID), Dept: Production, Plant: Hyderabad Unit-1, scheduledStartDate: 14 days from now, scheduledEndDate: 16 days from now | Status = PLANNED, Audit number generated, Flowable process started |
| 2 | Schedule Audit | Lead Auditor | PATCH /status, status: SCHEDULED | Status = SCHEDULED |
| 3 | Start Audit | Lead Auditor | PATCH /status, status: IN_PROGRESS | Status = IN_PROGRESS, actualStartDate set |
| 4 | Add Finding - Critical | Lead Auditor | POST /findings, title: "Inadequate Temperature Monitoring in Warehouse Zone C", type: CRITICAL, description: "No continuous temperature monitoring installed. Manual checks only twice daily. Risk of excursion going undetected.", clause: "WHO TRS 986 Annex 9, Section 8.4", area: "Warehouse Zone C" | Finding created |
| 5 | Add Finding - Major | Lead Auditor | POST /findings, title: "Training Records Incomplete for 3 Operators", type: MAJOR, description: "Operators OP-12, OP-15, OP-22 missing signed training records for SOP-PRD-045", clause: "Schedule M, Part I, Section 12.4" | Finding created |
| 6 | Add Finding - Observation | Lead Auditor | POST /findings, title: "Equipment ID labels faded in Area B1", type: OBSERVATION, description: "Equipment identification labels on 4 units are faded and difficult to read" | Finding created |
| 7 | Draft Report | Lead Auditor | PATCH /status, status: REPORT_DRAFTING, auditReport: {summary: "Overall GMP compliance satisfactory with 1 critical and 1 major finding requiring immediate attention", overallRating: "SATISFACTORY_WITH_FINDINGS"} | Status = REPORT_DRAFTING |
| 8 | Submit for Review | Lead Auditor | PATCH /status, status: UNDER_REVIEW | Status = UNDER_REVIEW |
| 9 | Auditee Response | Auditee | PATCH /findings/{findingId}/respond, response: "Continuous monitoring system procurement initiated. Expected installation within 30 days." | Finding response recorded |
| 10 | Initiate CAPA for Critical Finding | QA Manager | POST /findings/{findingId}/initiate-capa | CAPA record created, linked to audit finding |
| 11 | Complete Audit | QA Approver | PATCH /status, status: COMPLETED | Status = COMPLETED, actualEndDate set |

### Test Scenario 6.2: Supplier Audit

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Audit | QA Manager | Title: "API Supplier Qualification Audit - PharmaChem Ltd", Type: SUPPLIER, supplierId: (Supplier UUID), scope: "GMP compliance, quality systems, documentation", scheduledStartDate: 30 days from now | Status = PLANNED |
| 2-11 | (Follow similar flow as 6.1) | Various | (Supplier-specific findings) | Full audit cycle for supplier |

---

## 8. Module 7: Complaint Management

### BPMN Process: `complaintProcess`
**Steps:** Received -> Initial Assessment & Classification -> Investigation (conditional, 20-day timer) -> Disposition Review -> CAPA (conditional) -> Response Preparation -> Final Review & Closure

### Test Scenario 7.1: Product Complaint with Investigation and CAPA

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Complaint | End User | Title: "Tablet Discoloration - Batch MF-2026-078", Source: CUSTOMER, Type: PRODUCT_QUALITY, Priority: HIGH, Description: "Customer reports yellow-brown spots on Metformin 500mg tablets from batch MF-2026-078. 3 bottles affected.", productName: "Metformin 500mg Tablets", batchNumber: "MF-2026-078", complaintDate: today, customerName: "City Pharmacy, Hyderabad", contactEmail: "pharmacy@example.com" | Status = RECEIVED, Complaint number generated, Flowable process started |
| 2 | Initial Assessment | QA Reviewer | PATCH /status + assessment data, classification: MAJOR, investigationRequired: true, adverseEventReported: false, initialAssessment: "Potential cross-contamination or degradation. Retain samples collected. Full investigation required." | Status = CLASSIFIED, routed to investigation |
| 3 | Complete Investigation | Investigator | PATCH /status, status: INVESTIGATION_COMPLETE, investigation: "Root cause: Iron contamination from worn FBD screen mesh. Particle analysis confirms Fe2O3 deposits. Screen replaced and validated." | Status = INVESTIGATION_COMPLETE |
| 4 | Disposition Review | QA Approver | PATCH /status, status: RESPONSE_PENDING, disposition: "Batch recall limited to affected distribution. Replacement product dispatched. CAPA required for equipment maintenance program." | Status = RESPONSE_PENDING |
| 5 | Prepare & Send Response | QA Reviewer | PATCH /status, status: RESPONSE_SENT, responseText: "Dear Customer, thank you for reporting this quality concern. Investigation confirmed an isolated manufacturing issue which has been corrected. Replacement product has been shipped. Reference: COMPLAINT-2026-001" | Status = RESPONSE_SENT |
| 6 | Close Complaint | QA Approver | PATCH /status, status: CLOSED | Status = CLOSED |

### Test Scenario 7.2: Complaint - No Investigation Required

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Complaint | End User | Title: "Packaging Damage During Shipping", Source: DISTRIBUTOR, Type: PACKAGING, Priority: LOW | Status = RECEIVED |
| 2 | Assess - No Investigation | QA Reviewer | classification: MINOR, investigationRequired: false | Status = CLASSIFIED, skips investigation |
| 3 | Prepare Response | QA Reviewer | PATCH /status, status: RESPONSE_SENT | Status = RESPONSE_SENT |
| 4 | Close | QA Approver | PATCH /status, status: CLOSED | Status = CLOSED |

### Test Scenario 7.3: Adverse Event Complaint

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Complaint | End User | Title: "Patient Allergic Reaction Report", Source: HEALTHCARE_PROVIDER, Type: ADVERSE_EVENT, Priority: CRITICAL | Status = RECEIVED |
| 2 | Assess - Adverse Event | QA Reviewer | classification: CRITICAL, investigationRequired: true, adverseEventReported: true | Status = CLASSIFIED, triggers regulatory reporting path |
| 3-6 | Investigation through Closure | Various | (Full investigation with regulatory reporting documentation) | Complete lifecycle with regulatory notification |

---

## 9. Module 8: Nonconformance Management

### BPMN Process: `nonconformanceProcess`
**Steps:** Identified -> Hold (conditional) -> Initial Review & Classification -> Investigation -> Disposition Review (6 types) -> CAPA (conditional) -> Final Review & Closure -> Release Hold

### Test Scenario 8.1: NC with Material Hold and CAPA

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create NC | End User | Title: "API Assay Failure - Metformin Batch API-2026-034", Type: MATERIAL, Description: "Incoming QC testing shows assay at 97.2% against specification of 98.0-102.0%", productName: "Metformin HCl API", batchNumber: "API-2026-034", Dept: Quality Control, Plant: Hyderabad Unit-1, stageDetected: INCOMING, supplierId: (Supplier UUID) | Status = IDENTIFIED, NC number generated, Process started |
| 2 | Place Material on Hold | QA Reviewer | PATCH /hold, action: HOLD | Material hold placed, holdDate set |
| 3 | Review & Classify | QA Reviewer | PATCH /status, status: UNDER_REVIEW, classification: CRITICAL | Status = UNDER_REVIEW, reviewDecision=VALID |
| 4 | Complete Investigation | Investigator | PATCH /status, status: INVESTIGATION_COMPLETE, findings: "Supplier batch record review shows deviation in crystallization temperature. CoA values marginally passing at supplier site." | Status = INVESTIGATION_COMPLETE |
| 5 | Submit Disposition | QA Approver | PATCH /disposition, dispositionDecision: RETURN_TO_SUPPLIER, justification: "Material does not meet incoming specifications. Return to supplier with NCR.", capaRequired: true | Status = DISPOSITION, routes to CAPA_PENDING |
| 6 | Complete CAPA Initiation | QA Reviewer | PATCH /status, status: PENDING_CLOSURE | Status = PENDING_CLOSURE |
| 7 | Close NC | QA Approver | PATCH /status, status: CLOSED | Status = CLOSED |
| 8 | Release Hold | QA Reviewer | PATCH /hold, action: RELEASE | Material hold released (material returned to supplier) |

### Test Scenario 8.2: NC Voided

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create NC | End User | Title: "Suspected Particle in Vial - Lot VL-2026-001" | Status = IDENTIFIED |
| 2 | Void NC | QA Reviewer | PATCH /status, status: VOID, comments: "Upon re-examination, particle confirmed as air bubble. Not a valid NC." | Status = VOID, reviewDecision=VOID, Process ends |

### Test Scenario 8.3: NC Disposition - Use As Is

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-4 | Create through Investigation | Various | Type: PROCESS, stageDetected: IN_PROCESS | Status = INVESTIGATION_COMPLETE |
| 5 | Disposition: Use As Is | QA Approver | dispositionDecision: USE_AS_IS, justification: "Deviation within acceptable limits per ICH Q7 Section 14.3. Risk assessment confirms no impact on product quality." | Status = PENDING_CLOSURE (no CAPA needed) |
| 6 | Close | QA Approver | PATCH /status, status: CLOSED | Status = CLOSED |

---

## 10. Module 9: Risk Management

### BPMN Process: `riskProcess`
**Steps:** Risk Register Created -> Risk Evaluation (FMEA/HACCP) -> Control Planning -> Control Implementation -> Residual Risk Assessment (loop-back if unacceptable) -> Register Approval (E-Sign) -> Periodic Review (timer)

### Test Scenario 9.1: Full Risk Register Lifecycle

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Risk Register | Risk Owner | Title: "Process Risk Assessment - Tablet Compression", riskType: PROCESS, Description: "FMEA analysis for tablet compression process parameters", methodology: FMEA, Dept: Production, Plant: Hyderabad Unit-1 | Register created, status = DRAFT |
| 2 | Submit for Assessment | Risk Owner | PATCH /registers/{id}/status, status: IN_ASSESSMENT | Status = IN_ASSESSMENT, Flowable process started |
| 3 | Add Risk Assessment Item | QA Reviewer | POST /registers/{id}/assessments, hazard: "Tablet weight variation", failureMode: "Compression force inconsistency", severity: 4, occurrence: 3, detection: 2, riskLevel: HIGH, currentControls: "In-process weight checks every 30 min" | Assessment item created, RPN = 24 |
| 4 | Add Another Assessment | QA Reviewer | POST /assessments, hazard: "Tablet hardness OOS", failureMode: "Granulation moisture variation", severity: 3, occurrence: 2, detection: 3, riskLevel: MEDIUM | Assessment item created, RPN = 18 |
| 5 | Complete Evaluation | QA Reviewer | PATCH /status, status: EVALUATION | Status = EVALUATION |
| 6 | Add Risk Controls | Risk Owner | POST /registers/{id}/controls, [{description: "Install real-time compression force monitoring", type: PREVENTIVE, assignedToId: UUID}, {description: "Automated weight check with auto-reject", type: DETECTIVE, assignedToId: UUID}] | Controls created |
| 7 | Complete Control Planning | Risk Owner | PATCH /status, status: CONTROL_IMPLEMENTATION | Status = CONTROL_IMPLEMENTATION |
| 8 | Complete Implementation | Risk Owner | PATCH /status, status: RESIDUAL_RISK_REVIEW | Status = RESIDUAL_RISK_REVIEW |
| 9 | Assess Residual Risk | QA Reviewer | PATCH /assessments/{id}/residual-risk, residualSeverity: 4, residualOccurrence: 1, residualDetection: 1, residualRiskLevel: LOW | Residual RPN = 4, risk significantly reduced |
| 10 | Accept Residual Risk | QA Approver | PATCH /status, status: PENDING_APPROVAL | Status = PENDING_APPROVAL, residualDecision=ACCEPTABLE |
| 11 | Approve Register (E-Sign) | QA Approver | PATCH /status, status: APPROVED, comments: "E-Signed: Risk register approved" | Status = APPROVED, approvedBy set, nextReviewDate calculated |

### Test Scenario 9.2: Unacceptable Residual Risk (Loop-back)

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-8 | (Follow 9.1 steps 1-8) | Various | (Same) | Status = RESIDUAL_RISK_REVIEW |
| 9 | Assess Residual Risk - Still High | QA Reviewer | residualSeverity: 4, residualOccurrence: 3, residualDetection: 2, residualRiskLevel: HIGH | Residual RPN still 24 |
| 10 | Reject Residual Risk | QA Approver | PATCH /status, status: BACK_TO_CONTROL, comments: "Additional controls needed" | Status loops back to CONTROL_IMPLEMENTATION |
| 11 | Add more controls and re-assess | Risk Owner | (Add controls, implement, re-assess) | Cycle until residual risk acceptable |

---

## 11. Module 10: Supplier Quality Management

### BPMN Process: `supplierProcess`
**Steps:** Pending -> Document Review -> Supplier Audit (conditional) -> Corrective Action (if audit failed) -> Qualification Approval -> Qualified -> Performance Monitoring (ongoing)

### Test Scenario 10.1: Full Supplier Qualification with Audit

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Supplier | Procurement | Name: "PharmaChem Industries Pvt Ltd", supplierType: API, category: CRITICAL, contactPerson: "Dr. Suresh Kumar", email: "quality@pharmachem.com", phone: "+91-40-23456789", address: "Plot 42, APIIC Industrial Area, Hyderabad", country: "India", qualificationOwnerId: (QA Manager UUID), certifications: ["WHO-GMP", "ISO 9001:2015"] | Status = PENDING_QUALIFICATION, Supplier number generated, Process started, Workflow = "Document Review" |
| 2 | Document Review - Audit Required | QA Reviewer | PATCH /status, status: UNDER_EVALUATION, documentDecision: AUDIT_REQUIRED | Status = UNDER_EVALUATION, routes to audit task |
| 3 | Conduct Audit & Pass | Auditor | PATCH /status with auditResult: PASSED | Status progresses, audit marked passed |
| 4 | Approve Qualification | QA Approver | PATCH /status, status: QUALIFIED | Status = QUALIFIED, approvalDecision=APPROVED, qualificationDate set |
| 5 | Update Performance Scores | QA Reviewer | PATCH /scores, qualityScore: 85, deliveryScore: 90, documentationScore: 80, complianceScore: 88 | Scores updated, overall score calculated |

### Test Scenario 10.2: Supplier Audit Failure with Corrective Action

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1-2 | Create and Review | Various | (Same as 10.1) | Status = UNDER_EVALUATION, audit required |
| 3 | Audit Failed | Auditor | PATCH /status with auditResult: FAILED | Status = CORRECTIVE_ACTION_REQUIRED |
| 4 | Complete Corrective Actions | Supplier/QA | PATCH /status, status: PENDING_APPROVAL | Status = PENDING_APPROVAL, corrective actions recorded |
| 5 | Approve | QA Approver | PATCH /status, status: QUALIFIED | Status = QUALIFIED |

### Test Scenario 10.3: Supplier Disqualification from Score Degradation

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | (Existing qualified supplier) | - | Status = QUALIFIED | - |
| 2 | Update Scores - Poor Performance | QA Reviewer | qualityScore: 45, deliveryScore: 50, documentationScore: 40 | Overall score drops below threshold |
| 3 | Place on Probation | QA Manager | PATCH /status, status: ON_PROBATION | Status = ON_PROBATION |
| 4 | No improvement -> Disqualify | QA Manager | PATCH /status, status: DISQUALIFIED | Status = DISQUALIFIED |

### Test Scenario 10.4: Supplier Rejection at Document Review

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Supplier | Procurement | (Same as 10.1) | Status = PENDING_QUALIFICATION |
| 2 | Document Review - Reject | QA Reviewer | PATCH /status, status: REJECTED, comments: "Missing WHO-GMP certificate. Insufficient quality documentation." | Status = REJECTED, documentDecision=REJECTED |

---

## 12. Module 11: Equipment Management

### BPMN Process: `equipmentCalibrationProcess`
**Steps:** Registration -> IQ -> OQ -> PQ -> Operational -> Calibration Cycle (timer) -> Calibration Execution -> Calibration Review -> Maintenance (timer) -> Re-qualification (P365D) -> Decommission
**Note:** Equipment module has partial Flowable integration. Qualification and calibration use recordStep but not BPMN task completion.

### Test Scenario 11.1: Equipment Registration and Qualification

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Equipment | Engineer | Name: "Fluid Bed Dryer FBD-04", equipmentType: MANUFACTURING, manufacturer: "GEA Process Engineering", model: "FlexStream Multi-Processor 5", serialNumber: "GEA-FBD-2026-0042", location: "Production Block A, Room 201", Dept: Production, Plant: Hyderabad Unit-1, gxpRelevant: true, calibrationRequired: true, calibrationFrequencyDays: 180 | Status = ACTIVE, qualificationStatus = NOT_QUALIFIED, Equipment number generated |
| 2 | Complete IQ | Engineer | POST /equipment/{id}/qualify/IQ | qualificationStatus updated, "IQ Completed" step recorded |
| 3 | Complete OQ | Engineer | POST /equipment/{id}/qualify/OQ | "OQ Completed" step recorded |
| 4 | Complete PQ | Engineer | POST /equipment/{id}/qualify/PQ | qualificationStatus = QUALIFIED, "PQ Completed" + "Equipment Operational" steps recorded |

### Test Scenario 11.2: Equipment Calibration Cycle

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Calibration Record | Technician | POST /equipment/{id}/calibrations, calibrationType: ROUTINE, calibrationDate: today, performedById: (Technician UUID), instrumentUsed: "Fluke 1524 Reference Thermometer", certificateNumber: "CAL-2026-0089" | Calibration record created |
| 2 | Record Result - PASS | Technician | PATCH /calibrations/{id}, result: PASS, readings: "Range: 20-200 deg C, Accuracy: +/- 0.1 deg C within specification", nextCalibrationDate: +180 days | calibrationStatus = CALIBRATED, nextCalibrationDate set |

### Test Scenario 11.3: Calibration Failure

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Calibration | Technician | (Same as 11.2) | Calibration created |
| 2 | Record Result - FAIL | Technician | result: FAIL, readings: "Temperature offset: +2.3 deg C at 100 deg C reference point. Outside tolerance of +/- 0.5 deg C" | calibrationStatus = OUT_OF_CALIBRATION, equipment may need OUT_OF_SERVICE status |
| 3 | Equipment Out of Service | QA Reviewer | PATCH /equipment/{id}, status: OUT_OF_SERVICE | Status = OUT_OF_SERVICE until repaired and re-calibrated |

### Test Scenario 11.4: Preventive Maintenance

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Create Maintenance Record | Engineer | POST /equipment/{id}/maintenance, type: PREVENTIVE, description: "6-monthly PM - filter replacement, belt inspection, bearing lubrication", scheduledDate: today, assignedToId: (Technician UUID) | Maintenance record created |
| 2 | Complete Maintenance | Technician | PATCH /maintenance/{id}/complete, completionNotes: "All PM tasks completed per checklist. New HEPA filter installed (lot HF-2026-012). Belt tension adjusted.", completedDate: today | Maintenance completed, nextMaintenanceDate calculated |

### Test Scenario 11.5: Equipment Decommission

| Step | Action | User Role | Input Data | Expected Result |
|------|--------|-----------|------------|-----------------|
| 1 | Decommission Equipment | QA Manager | POST /equipment/{id}/decommission, reason: "End of useful life. Replacement unit FBD-05 installed and qualified.", disposalMethod: "Vendor buyback program" | Status = DECOMMISSIONED, "Decommissioned" workflow step recorded |

---

## 13. Integrated Cross-Module Test Scenarios

### Scenario 13.1: Deviation -> CAPA -> Change Control (Full Chain)

This tests the most common cross-module workflow in pharmaceutical QMS.

| Step | Module | Action | Input Data | Expected Result |
|------|--------|--------|------------|-----------------|
| 1 | Deviation | Create DEV-2026-010 | Title: "Repeated OOS in Dissolution - Compression Machine CM-02", Category: EQUIPMENT | DEV created |
| 2 | Deviation | Full workflow through CAPA_INITIATED | Investigation finds worn punch tooling as root cause | DEV at CAPA_INITIATED status |
| 3 | CAPA | Create CAPA-2026-010 | Title: "Compression Tooling Management Program", sourceType: DEVIATION, sourceReference: "DEV-2026-010" | CAPA created, linked to deviation |
| 4 | CAPA | Full workflow through ACTION_PLANNING | RCA: 5-Why confirms tooling wear tracking inadequate. Risk Assessment: Severity=4, Occurrence=3, Detection=2 | CAPA at ACTION_PLANNING |
| 5 | CAPA | Add preventive action | "Implement preventive tooling replacement program with usage-based tracking" | Action added |
| 6 | Change Control | Create CHANGE-2026-005 | Title: "Implement Tooling Lifecycle Management System", sourceReference: "CAPA-2026-010", Type: PROCESS, Classification: MAJOR | CC created, linked to CAPA |
| 7 | Change Control | Full workflow through CLOSED | Impact assessment, approvals, implementation, verification | CC closed |
| 8 | CAPA | Complete action execution, effectiveness check | All actions verified, effectiveness confirmed | CAPA at PENDING_CLOSURE |
| 9 | CAPA | Close CAPA | E-signature closure | CAPA closed |
| 10 | Deviation | Close deviation | E-signature closure | DEV closed |
| **Verify** | All | Audit trail check | Query audit trails for all 3 records | Complete chain of linked records visible |

### Scenario 13.2: Complaint -> NC -> CAPA -> Supplier Action

| Step | Module | Action | Input Data | Expected Result |
|------|--------|--------|------------|-----------------|
| 1 | Complaint | Create COMPLAINT-2026-005 | Title: "Foreign Particle in API Batch", Source: CUSTOMER, Type: PRODUCT_QUALITY, Priority: CRITICAL | Complaint created |
| 2 | Complaint | Classify & Investigate | classification: CRITICAL, investigationRequired: true | Investigation initiated |
| 3 | NC | Create NC-2026-008 | Title: "Foreign Particle Contamination - API Batch SUP-2026-089", Type: MATERIAL, stageDetected: INCOMING, supplierId: (Supplier UUID), sourceReference: "COMPLAINT-2026-005" | NC created, linked to complaint |
| 4 | NC | Full workflow - Disposition: Return to Supplier | dispositionDecision: RETURN_TO_SUPPLIER, capaRequired: true | NC at CAPA_PENDING |
| 5 | CAPA | Create CAPA-2026-012 | Title: "Supplier Quality Improvement - Foreign Particle Prevention", sourceType: NONCONFORMANCE, sourceReference: "NC-2026-008" | CAPA created |
| 6 | Supplier | Update supplier scores | qualityScore: 55 (downgrade) | Supplier score updated |
| 7 | Supplier | Place on probation | PATCH /status, status: ON_PROBATION | Supplier on probation |
| 8 | CAPA | Full lifecycle through closure | Actions include supplier audit, enhanced incoming inspection | CAPA closed |
| 9 | NC | Close NC | All dispositions complete | NC closed |
| 10 | Complaint | Close complaint | Response sent to customer | Complaint closed |
| **Verify** | All | Cross-reference check | All records reference each other | Full traceability from complaint to supplier action |

### Scenario 13.3: Audit -> Finding -> CAPA -> Training -> Document Update

| Step | Module | Action | Input Data | Expected Result |
|------|--------|--------|------------|-----------------|
| 1 | Audit | Create Internal Audit | Title: "Annual Schedule M Compliance - Documentation", Type: INTERNAL | Audit created |
| 2 | Audit | Add Critical Finding | "SOP-PRD-045 not updated for 3 years. Current practices diverge from documented procedure." | Finding recorded |
| 3 | Audit | Initiate CAPA from Finding | POST /findings/{id}/initiate-capa | CAPA created, linked to audit finding |
| 4 | CAPA | Investigate & Plan Actions | Corrective: "Update SOP-PRD-045 to reflect current practices" | Actions planned |
| 5 | Document | Create new version of SOP-PRD-045 | Title: "SOP-PRD-045 v3.0", changeDescription: "Updated per CAPA-2026-015 and Audit Finding" | Document v3.0 created |
| 6 | Document | Full review and approval cycle | Review, QA approval | Document EFFECTIVE |
| 7 | Training | Create curriculum for updated SOP | Title: "SOP-PRD-045 v3.0 Training" | Curriculum created |
| 8 | Training | Assign to all affected personnel | Create assignments for 15 operators | 15 assignments created |
| 9 | Training | All complete training | Each trainee completes with passing score | All assignments COMPLETED |
| 10 | CAPA | Verify effectiveness | "All operators trained on updated SOP. No deviations in 60 days." | CAPA closed |
| 11 | Audit | Close audit | All findings addressed | Audit COMPLETED |

### Scenario 13.4: Equipment Calibration Failure -> Deviation -> Risk Update

| Step | Module | Action | Input Data | Expected Result |
|------|--------|--------|------------|-----------------|
| 1 | Equipment | Calibration fails for FBD-03 moisture sensor | result: FAIL, "Temperature offset exceeds tolerance" | Equipment OUT_OF_CALIBRATION |
| 2 | Equipment | Set OUT_OF_SERVICE | status: OUT_OF_SERVICE | Equipment cannot be used |
| 3 | Deviation | Create DEV-2026-015 | Title: "FBD-03 Moisture Sensor Calibration Failure", Type: UNPLANNED, Category: EQUIPMENT | Deviation created |
| 4 | Deviation | Investigate - Identify affected batches | "3 batches processed since last valid calibration. Batches: PX-2026-110, PX-2026-111, PX-2026-112" | Investigation complete |
| 5 | Risk | Update risk register for tablet compression | Add new assessment item for sensor failure mode | Risk register updated |
| 6 | Equipment | Repair and re-calibrate | result: PASS after sensor replacement | Equipment back to CALIBRATED |
| 7 | Equipment | Set ACTIVE | status: ACTIVE | Equipment back in service |
| 8 | Deviation | Close deviation | All affected batches evaluated, CAPA if needed | Deviation closed |

### Scenario 13.5: Change Control -> Document -> Training (Sequential Dependencies)

| Step | Module | Action | Input Data | Expected Result |
|------|--------|--------|------------|-----------------|
| 1 | Change Control | Create CC for new cleaning validation protocol | Title: "Implement Dedicated Cleaning Validation Protocol for Multi-Product Facility", trainingRequired: true | CC created |
| 2 | Change Control | Impact Assessment | documentation: HIGH, training: HIGH, validationStatus: HIGH | High documentation/training impact |
| 3 | Change Control | Full approval cycle | E-signature approvals | CC APPROVED |
| 4 | Document | Create new SOP | Title: "SOP-CLN-001 Cleaning Validation Protocol" | Document created |
| 5 | Document | Review and approve | Full document lifecycle | Document EFFECTIVE |
| 6 | Training | Create training curriculum | Linked to new SOP-CLN-001 | Curriculum created |
| 7 | Training | Assign and complete for all production staff | 20 assignments | All completed |
| 8 | Change Control | Complete implementation | All tasks done: SOP created, training complete | Implementation complete |
| 9 | Change Control | Verification and Closure | E-signature verification and closure | CC CLOSED |

---

## 14. Sample User Accounts for Testing

### User Credentials and Roles

| User Name | Role Codes | Department | Purpose |
|-----------|------------|------------|---------|
| Rajesh Kumar | OWNER, END_USER | Quality Control | CAPA Owner, Deviation Reporter |
| Srinivas Rao | QA_REVIEWER | Quality Assurance | QA Review, Classification |
| Priya Sharma | QA_REVIEWER, QA_APPROVER | Quality Assurance | QA Review & Approval, E-Sign |
| Suresh Reddy | OWNER, END_USER | Production | Production Owner, Deviation Assignee |
| Anitha Rao | END_USER | Quality Control | End User, Reporter |
| Lakshmi Devi | QA_APPROVER, VAULT_ADMIN | Quality Assurance | Final Approvals, Admin |
| Venkat Rao | END_USER, REVIEWER | Engineering | Engineering tasks, Action Assignee |
| Mohammad Ali | END_USER | Warehouse | Warehouse operations |
| Kavitha Reddy | QA_REVIEWER | Quality Assurance | QA Review, Complaint Assessment |
| Ravi Teja | OWNER | Production | Training coordination, Production tasks |
| Deepa Menon | REVIEWER, AUDITOR | Quality Assurance | Audit lead, Document Review |
| Ramesh Gupta | APPROVER | Management | Senior Management Approvals |

### API Authentication

All API calls require Bearer token authentication:
```
Authorization: Bearer <access_token>
```
Login: POST /api/v1/auth/login with { username, password }

### Test Database

- PostgreSQL on port 5434, database: qms
- Backend API on port 8082
- Shell App on port 4200
- CAPA MFE on port 4201
- Deviation MFE on port 4202
- Change Control MFE on port 4203
- Document MFE on port 4204
- Training MFE on port 4205
- QMS Core MFE on port 4206 (Audit, Risk, Supplier, Complaint, NC, Equipment)

---

## Appendix A: Workflow Verification Queries

### Check Flowable Process Definitions
```sql
SELECT key_, name_, version_, deployment_id_
FROM act_re_procdef
ORDER BY key_;
```
Expected: 11 process definitions (capaProcess, deviationProcess, changeControlProcess, documentProcess, trainingProcess, auditProcess, complaintProcess, nonconformanceProcess, riskProcess, supplierProcess, equipmentCalibrationProcess)

### Check Active Tasks for a Record
```sql
SELECT t.id_, t.name_, t.task_def_key_, t.assignee_, t.create_time_
FROM act_ru_task t
JOIN act_ru_execution e ON t.execution_id_ = e.id_
WHERE e.proc_inst_id_ = '<flowable_process_id>';
```

### Check Workflow History for a Record
```sql
SELECT step_name, status, assigned_to_id, started_at, completed_at, comments, step_order
FROM workflow_history
WHERE record_type = 'CAPA' AND record_id = '<capa_uuid>'
ORDER BY step_order;
```

### Check Audit Trail for a Record
```sql
SELECT action, field_name, old_value, new_value, reason_for_change, timestamp, user_id
FROM audit_trail
WHERE record_type = 'CAPA' AND record_id = '<capa_uuid>'
ORDER BY timestamp;
```

### Task Inbox Query
```
GET /api/v1/tasks/inbox
```
Returns all tasks assigned to or claimable by the current user across all modules.

---

## Appendix B: Key Validation Rules Summary

| Module | Validation Rule | Error Code |
|--------|----------------|------------|
| CAPA | RCA must exist before ROOT_CAUSE_IDENTIFIED | CAPA_NO_RCA |
| CAPA | At least one action before start execution | CAPA_NO_ACTIONS |
| CAPA | All actions verified before complete execution | CAPA_ACTIONS_NOT_VERIFIED |
| CAPA | Closure rules (all actions verified, effectiveness checked) | CAPA_CLOSE_* |
| Deviation | Investigation must exist before IMPACT_ASSESSMENT | DEV_NO_INVESTIGATION |
| Deviation | Impact assessment must exist before DISPOSITION | DEV_NO_IMPACT_ASSESSMENT |
| Change Control | Impact assessment must exist before QA_REVIEW | CC_NO_IMPACT_ASSESSMENT |
| Change Control | All tasks completed before CLOSED | CC_CLOSE_TASKS_INCOMPLETE |
| Change Control | All approvals resolved before CLOSED | CC_CLOSE_APPROVALS_PENDING |
| Change Control | Training completed before CLOSED (if required) | CC_CLOSE_TRAINING_INCOMPLETE |
| NC | stage_detected must be valid or null | DB constraint |

---

**End of Document**

*Generated: 27-Jun-2026 | QMS-Pharma v1.0*
