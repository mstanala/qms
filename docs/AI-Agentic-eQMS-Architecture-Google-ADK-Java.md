# Enterprise AI Agentic eQMS Architecture
## Google ADK (Java) Technical Design Document

**Document Version:** 1.0
**Date:** June 2026
**Prepared for:** MechatronLabs QMS-Pharma Platform
**Classification:** Confidential - For Investors, Customers, Implementation Teams & Regulatory Discussions

---

## Table of Contents

| # | Chapter | Page |
|---|---------|------|
| 1 | Executive Summary | 3 |
| 2 | Current eQMS Architecture Analysis | 5 |
| 3 | Target AI Vision | 10 |
| 4 | Google ADK Java Overview | 13 |
| 5 | Reference Architecture | 16 |
| 6 | Multi-Agent AI Architecture | 19 |
| 7 | Supervisor Agent & Agent Orchestrator | 23 |
| 8 | Deviation AI Agent | 27 |
| 9 | CAPA AI Agent | 32 |
| 10 | Complaint AI Agent | 37 |
| 11 | Audit AI Agent | 41 |
| 12 | Document AI Agent | 45 |
| 13 | Training AI Agent | 49 |
| 14 | Supplier AI Agent | 52 |
| 15 | Equipment & Calibration AI Agent | 55 |
| 16 | Nonconformance AI Agent | 58 |
| 17 | Risk AI Agent | 61 |
| 18 | Change Control AI Agent | 64 |
| 19 | Regulatory Intelligence Agent | 67 |
| 20 | Predictive Compliance Agent | 70 |
| 21 | Root Cause Investigation Agent | 73 |
| 22 | AI Copilot | 76 |
| 23 | AI Workflow Orchestrator | 79 |
| 24 | MCP Server Integration | 82 |
| 25 | Tool Design & Tool Registry | 85 |
| 26 | Memory Architecture | 89 |
| 27 | RAG Architecture | 92 |
| 28 | Knowledge Graph Architecture | 96 |
| 29 | Vector Database Design | 99 |
| 30 | Document Intelligence & OCR | 102 |
| 31 | AI Prompt Engineering | 105 |
| 32 | LLM Selection (Gemini/OpenAI/Open Source) | 109 |
| 33 | Google Vertex AI Integration | 112 |
| 34 | Google ADK Java Code Architecture | 115 |
| 35 | Java Package Structure | 118 |
| 36 | Spring Boot Integration | 121 |
| 37 | BPMN & Flowable Integration | 124 |
| 38 | Event Bus Architecture | 127 |
| 39 | Kafka/RabbitMQ Integration | 130 |
| 40 | PostgreSQL + Vector Database Design | 133 |
| 41 | ElasticSearch Integration | 136 |
| 42 | REST API Design for AI Agents | 139 |
| 43 | AI Governance & Explainability | 142 |
| 44 | 21 CFR Part 11 Compliance for AI | 145 |
| 45 | GAMP5 AI Validation | 148 |
| 46 | AI Audit Trail | 151 |
| 47 | Agent Security | 154 |
| 48 | Human-in-the-Loop Approvals | 157 |
| 49 | Production Deployment (Kubernetes/GCP) | 160 |
| 50 | Implementation Roadmap (12 Months) | 163 |
| 51 | Cost Estimation | 167 |
| 52 | Future Vision: Autonomous Pharma Plant | 170 |
| 53 | Appendix: Sequence Diagrams & Agent Interactions | 173 |

---

# Chapter 1: Executive Summary

## 1.1 Purpose

This document defines the complete architecture for integrating AI Agentic capabilities into the MechatronLabs QMS-Pharma platform using Google's Agent Development Kit (ADK) for Java. The architecture transforms a traditional workflow-driven eQMS into an intelligent, semi-autonomous quality management ecosystem that accelerates compliance, reduces human error, and provides predictive insights -- all while maintaining full 21 CFR Part 11 compliance, GxP validation readiness, and human-in-the-loop oversight for regulated decisions.

## 1.2 Business Case

The pharmaceutical industry faces a critical challenge: the cost of quality operations represents 15-25% of total manufacturing costs for Indian pharma SMEs. Manual investigation of deviations averages 12-18 days. CAPA closure cycles extend to 45-90 days. Regulatory inspection readiness requires weeks of document preparation. AI agents can reduce these timelines by 40-70%.

**Key ROI Projections:**

| Metric | Current State | With AI Agents | Improvement |
|--------|--------------|----------------|-------------|
| Deviation Classification | 4-8 hours manual review | 5 minutes auto-classification + human confirmation | 95% faster |
| CAPA Root Cause Analysis | 5-10 days investigation | 2 hours AI-assisted with historical pattern matching | 80% faster |
| Audit Preparation | 2-4 weeks evidence gathering | 2-3 days automated evidence compilation | 85% faster |
| Document Drafting | 3-5 days SOP writing | 4 hours AI-drafted + human review | 75% faster |
| Complaint Triage | 2-4 hours per complaint | 10 minutes auto-assessment with adverse event flagging | 90% faster |
| Training Gap Detection | Reactive, post-inspection | Continuous proactive monitoring | Preventive vs. Reactive |
| Supplier Risk Prediction | Quarterly manual review | Real-time risk scoring with early warning | Predictive |
| Inspection Readiness | 4-6 weeks preparation | Always-ready with AI compliance monitoring | Continuous |

## 1.3 Solution Overview

The solution employs a **multi-agent architecture** built on Google ADK Java, where specialized AI agents are coordinated by a Supervisor Agent. Each agent operates within a specific QMS domain (Deviation, CAPA, Complaint, Audit, etc.) and is equipped with:

- **Tools** that invoke existing QMS REST APIs and Flowable workflow engine
- **MCP (Model Context Protocol) Servers** for standardized tool connectivity
- **RAG (Retrieval-Augmented Generation)** pipelines backed by vector databases for validated pharma knowledge
- **Memory Architecture** for agent state persistence and cross-conversation context
- **Human-in-the-Loop** approval gates that align with existing electronic signature and QA approval workflows

**Critical Design Principle:** AI agents **augment** human decision-making -- they never autonomously approve, close, or make GxP-critical decisions. Every regulated action requires explicit human confirmation through the existing electronic signature mechanism already implemented in the platform.

## 1.4 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Agent Framework | Google ADK Java 1.x | Agent orchestration, tool management, memory |
| LLM Primary | Google Gemini 2.5 Pro | Reasoning, analysis, generation |
| LLM Fallback | OpenAI GPT-4o / Llama 3.1 | Redundancy, specialized tasks |
| Backend | Spring Boot 3.5, Java 21 | Existing QMS platform |
| Workflow Engine | Flowable 7.1.0 | BPMN process automation |
| Database | PostgreSQL 17 | Operational data (existing) |
| Vector Database | pgvector (PostgreSQL extension) | Embeddings for RAG |
| Search Engine | Elasticsearch 8.x | Full-text search, analytics |
| Message Broker | Google Pub/Sub (primary), Kafka (alternative) | Event-driven agent communication |
| Document Processing | Google Document AI | OCR, form extraction |
| Embedding Model | Google text-embedding-005 | Vector embeddings |
| Deployment | Google Cloud Run / GKE | Container orchestration |
| Storage | Google Cloud Storage | Documents, agent artifacts |
| Monitoring | Google Cloud Operations Suite | Agent observability |

## 1.5 Regulatory Alignment

This architecture is designed for compliance with:
- **21 CFR Part 11** -- Electronic records and signatures for AI-assisted decisions
- **EU Annex 11** -- Computerized system validation for AI components
- **GAMP5 Category 5** -- Custom AI/ML software validation
- **ICH Q9** -- Quality risk management for AI governance
- **ICH Q10** -- Pharmaceutical quality system integration
- **FDA Guidance on AI/ML in Drug Manufacturing** (2023-2025)
- **EU AI Act** -- Risk classification for pharma AI systems
- **India Schedule M (2024 Revised)** -- GMP requirements for AI-augmented systems

---

# Chapter 2: Current eQMS Architecture Analysis

## 2.1 Existing System Landscape

The QMS-Pharma platform is a production-grade pharmaceutical quality management system with the following architecture:

### 2.1.1 Backend Architecture

```
mlabs-qms-pharma/
  src/main/java/com/qmspharma/
    controller/          # REST API endpoints
    service/             # Business logic layer
    repository/          # JPA data access
    model/
      entity/            # 60+ JPA entities
      dto/               # Request/Response DTOs
      enums/             # 40+ enum types
    config/              # Spring configuration
    security/            # JWT authentication
    workflow/            # Flowable delegates
    exception/           # Custom exceptions
  src/main/resources/
    processes/           # 11 BPMN process definitions
    db/migration/        # V1-V23 Flyway migrations
    application.yml      # Application configuration
```

**Technology:** Spring Boot 3.5, Java 21, PostgreSQL 17, Flowable 7.1.0, Google Cloud Storage

### 2.1.2 Frontend Architecture (Microfrontends)

```
shell-app (port 4200)      # Host app - layout, navigation, auth, admin
capa-mfe (port 4201)       # CAPA module
deviation-mfe (port 4202)  # Deviation module
change-control-mfe (4203)  # Change Control module
document-mfe (port 4204)   # Document Control module
training-mfe (port 4205)   # Training module
qms-core-mfe (port 4206)   # Risk, Audit, Supplier, Complaint, NC, Equipment
```

**Technology:** Angular 18, Module Federation, Angular Material

### 2.1.3 Database Schema (60+ Tables)

The system has a comprehensive PostgreSQL schema across 23 Flyway migrations:

**Core QMS Tables:**

| Module | Key Tables | Records Tracked |
|--------|-----------|-----------------|
| Deviation | deviations, deviation_investigations, deviation_impact_assessments, deviation_dispositions, deviation_affected_batches, deviation_immediate_actions | 10 statuses, 10 categories, 3 classifications |
| CAPA | capas, capa_root_cause_analyses, capa_five_why_entries, capa_fishbone_categories, capa_risk_assessments, capa_actions, capa_effectiveness_checks | 10 statuses, 3 types, 7 source types, FMEA scoring |
| Change Control | change_requests, change_impact_assessments, change_regulatory_filings, change_affected_documents, change_affected_products, change_implementation_tasks, change_training_requirements, change_approvals, change_effectiveness_reviews | 12 statuses, 10 types, 8-dimension impact, multi-level approval |
| Document | documents, document_versions, document_reviews, document_approvals, document_distribution, document_references | 12 types, 9 statuses, version control, periodic review |
| Training | training_curricula, training_assignments, training_matrix, training_sessions, training_session_attendees | 8 categories, 7 assignment reasons, competency tracking |
| Audit | audit_plans, audits, audit_team_members, audit_checklists, audit_checklist_items, audit_findings | 5 types, 7 statuses, finding-to-CAPA linkage |
| Risk | risk_registers, risk_assessments, risk_controls, risk_reviews | 8 types, 6 methodologies, FMEA/HACCP scoring |
| Supplier | suppliers, supplier_qualifications, supplier_scorecards, supplier_materials | 8 supplier types, scoring, requalification cycles |
| Complaint | complaints, complaint_samples, complaint_trending | 8 types, 7 sources, adverse event tracking, recall assessment |
| Nonconformance | nonconformances | 8 NC types, material hold/release, disposition decisions |
| Equipment | equipment, calibration_records, maintenance_records | 9 types, IQ/OQ/PQ qualification, calibration tracking |

**Shared Infrastructure Tables:**

| Table | Purpose | CFR Part 11 |
|-------|---------|-------------|
| users | 12 user types, password policies, OAuth/SAML | Yes - login audit |
| security_profiles | Custom permission profiles | Yes |
| application_roles | 8 role levels (END_USER to VAULT_ADMIN) | Yes |
| permissions | Module + Action + Resource triplet | Yes |
| electronic_signatures | Signature hash, meaning, IP logging | Yes - core requirement |
| audit_trail | ALCOA+ compliant change tracking | Yes - core requirement |
| workflow_history | Dual-tracking with Flowable engine | Yes |
| notifications | Task alerts, escalations, reminders | Yes |
| user_login_audit | IP, user_agent, timestamp logging | Yes - core requirement |

## 2.2 Existing Workflow Architecture

The platform runs **11 BPMN process definitions** on Flowable 7.1.0:

### 2.2.1 Deviation Process (`deviationProcess`)
```
Reported -> QA Review & Classification -> [CLASSIFIED/REJECTED]
  -> Root Cause Investigation (P25D escalation timer)
  -> Impact Assessment (4-dimension matrix)
  -> Disposition Decision (E-Signature)
  -> [CAPA Required?] -> Initiate CAPA (conditional)
  -> QA Final Review & Closure (E-Signature)
  -> Notify Closure -> End
```

### 2.2.2 CAPA Process (`capaProcess`)
```
Initiated -> QA Review -> [APPROVED/REJECTED]
  -> Investigation (RCA: 5-Why, Fishbone, Fault Tree)
  -> Risk Assessment (FMEA: Severity x Occurrence x Detection = RPN)
  -> Action Planning -> Action Execution (R3/P7D reminder timer)
  -> Effectiveness Check -> [EFFECTIVE/NOT_EFFECTIVE(loop back)]
  -> QA Approval -> Notify Closure -> End
```

### 2.2.3 Change Control Process (`changeControlProcess`)
```
Created -> Submit Change Request
  -> Impact Assessment (8-Dimension Matrix)
  -> QA Review
  -> [Regulatory Filing Required?] -> RA Review (conditional)
  -> Pending Approval (E-Signature)
  -> [APPROVED/REJECTED]
  -> Implementation (P30D escalation timer)
  -> Verification (E-Signature)
  -> Effectiveness Check (E-Signature)
  -> Notify Closure -> End
```

### 2.2.4 Complaint Process (`complaintProcess`)
```
Received -> Initial Assessment (classify severity, adverse event, regulatory)
  -> [Investigation Required?]
  -> [Adverse Event?] -> File Regulatory Report (P15D timer)
  -> Root Cause Investigation (P20D escalation timer)
  -> Disposition Review (E-Signature) -> [APPROVED/FURTHER_INVESTIGATION(loop)]
  -> [CAPA Required?] -> Create CAPA (sourceType: COMPLAINT)
  -> [Deviation Identified?] -> Create Deviation (sourceType: COMPLAINT)
  -> [Recall Required?] -> Initiate Recall Process
  -> Prepare & Send Response
  -> QA Final Review & Closure -> End
```

### 2.2.5 Audit Process (`auditProcess`)
```
Initiated -> Audit Planning -> Plan Approval
  -> Audit Execution (reportDueDate escalation timer)
  -> Findings Review (classify: Critical/Major/Minor/OFI)
  -> [CAPA Required?] -> Create CAPA Records (sourceType: AUDIT_FINDING)
  -> [Deviation Required?] -> Create Deviation
  -> [Change Required?] -> Create Change Request
  -> Auditee Response -> Review Response -> [ACCEPTED/REVISION_REQUIRED(loop)]
  -> Verify Findings
  -> Close Audit (E-Signature) -> Notify Closure -> End
```

### 2.2.6 Document Process (`documentProcess`)
```
Drafted -> Document Draft Review (DOC_REVIEWER, QA_REVIEWER)
  -> [APPROVED/REVISION_REQUIRED]
  -> QA Approval (E-Signature)
  -> [APPROVED] -> Training Assignment + Make Document Effective
  -> [REJECTED] -> Author Revision (loop)
  -> Periodic Review Reminder (P365D timer)
  -> Notify Document Effective -> End
```

### 2.2.7 Equipment Process (`equipmentProcess`)
```
Registered -> Equipment Qualification (IQ -> OQ -> PQ)
  -> [GxP Relevant?] -> Create Change Request (Category: EQUIPMENT)
  -> [Training Required?] -> Create Training Assignment
  -> Equipment Operational (Status: ACTIVE)
  -> Perform Maintenance (maintenance frequency timer)
  -> Perform Calibration (calibration frequency timer)
  -> Calibration Review -> [PASS/FAIL]
  -> [FAIL] -> Impact Assessment -> Create Deviation (CALIBRATION_FAILURE)
  -> [CAPA Required?] -> Create CAPA (sourceType: EQUIPMENT)
  -> Repair & Re-calibrate
  -> [End of Life] -> Decommission (E-Signature) -> Create Change Request
```

### 2.2.8 Supplier Process (`supplierProcess`)
```
Registered -> Document Review (GMP/ISO/FDA certs, Quality Agreements, COAs)
  -> [AUDIT_REQUIRED/NO_AUDIT/REJECTED]
  -> Schedule Audit (Cross-Module: Audit Mgmt)
  -> Supplier Audit -> [PASSED/FAILED]
  -> [FAILED] -> Supplier Corrective Action
  -> Qualification Approval (E-Signature)
  -> Notify Qualified -> Supplier Qualified
  -> Re-qualification cycle (requalificationFrequencyMonths timer)
  -> NC Detected -> Update Supplier Scores -> [Below Threshold?]
  -> ON_PROBATION -> Improvement Plan -> [Achieved?]
  -> [No] -> DISQUALIFIED -> Create Change Request (alternate sourcing)
```

### 2.2.9 Nonconformance Process (`nonconformanceProcess`)
```
Identified -> [Immediate Hold Required?] -> Place Material ON_HOLD
  -> Initial Review (classify: CRITICAL/MAJOR/MINOR)
  -> [REJECTED/ACCEPTED]
  -> Investigation (root cause analysis)
  -> [Supplier Related?] -> Notify Supplier, Issue SCAR, Update Scores
  -> [Deviation Identified?] -> Create Deviation (sourceType: NONCONFORMANCE)
  -> Disposition Review (E-Signature: USE_AS_IS/REWORK/REPROCESS/RETURN/SCRAP/REJECT)
  -> [REWORK/REPROCESS] -> [Non-Standard?] -> Create Change Request
  -> [RETURN_TO_SUPPLIER] -> Process Return, Update Scores
  -> [CAPA Required?] -> Create CAPA (sourceType: NONCONFORMANCE)
  -> [Risk Update Required?] -> Update Risk Register
  -> QA Final Review & Closure (E-Signature, Release material hold)
  -> [Hold Active?] -> Release Hold -> Notify Closure -> End
```

### 2.2.10 Risk Process (`riskProcess`)
```
Risk Register Created (Sources: Deviation, CAPA, Complaint, Change Control, Audit Finding)
  -> Risk Evaluation (FMEA/HACCP/FTA/PHA: Severity x Occurrence x Detectability)
  -> Control Planning (Preventive, Detective, Corrective)
  -> Control Implementation (Evidence collection)
  -> [Process Change Required?] -> Create Change Request (sourceType: RISK_ASSESSMENT)
  -> Residual Risk Review (Re-score with controls)
  -> [ACCEPTABLE] -> Register Approval (E-Signature) -> Notify Approved -> End
  -> [UNACCEPTABLE] -> CAPA Initiation + Deviation Report (control failure)
  -> Periodic Review Reminder (reviewFrequencyMonths timer)
```

### 2.2.11 Training Process (`trainingProcess`)
```
Training Assigned (Sources: Document Effective, Change Control, Deviation Closure,
                   CAPA Action, Manual Assignment)
  -> Complete Training (dueDate escalation timer -> TRAINING_OVERDUE)
  -> [PASSED/FAILED(retry)/FAILED(max attempts -> Escalation Required)]
  -> Verify Training (QA_APPROVER, TRAINING_COORDINATOR)
  -> Notify Completion -> Update Source Record
  -> Retraining Reminder (validityMonths timer -> RETRAINING_DUE)
  -> End: Training Verified
```

## 2.3 Cross-Module Automation Chains (Existing)

The following automated chains already exist in the BPMN workflows:

```
1. Deviation -> CAPA
   deviationProcess: capaRequired=true -> capaInitiation task
   CAPA created with sourceType=DEVIATION

2. Complaint -> Deviation -> CAPA -> Recall
   complaintProcess: dispositionApproved -> Create CAPA (COMPLAINT)
                   -> Create Deviation (COMPLAINT) -> Recall Assessment

3. Audit Finding -> CAPA / Change / Deviation
   auditProcess: findingsReview -> Create CAPA (AUDIT_FINDING)
               -> Create Deviation (AUDIT_FINDING)
               -> Create Change Request (AUDIT_FINDING)

4. Equipment Calibration Failure -> Deviation -> CAPA
   equipmentProcess: calibrationResult=FAIL -> Create Deviation (CALIBRATION_FAILURE)
                   -> capaRequired=true -> Create CAPA (EQUIPMENT)

5. Nonconformance -> Supplier SCAR -> CAPA -> Risk
   nonconformanceProcess: supplierRelated -> Issue SCAR -> Update Scores
                        -> Create Deviation -> Create CAPA (NONCONFORMANCE)
                        -> Update Risk Register

6. Document Approval -> Training Assignment
   documentProcess: approvalDecision=APPROVED -> Training Assignment task

7. Change Control -> Document Revision -> Training
   changeControlProcess: implementation -> Affected Documents -> Training Requirements

8. Risk Assessment -> Change Request / CAPA
   riskProcess: processChangeRequired -> Create Change Request (RISK_ASSESSMENT)
              residualDecision=UNACCEPTABLE -> CAPA Initiation

9. Supplier Qualification -> Audit -> CAPA
   supplierProcess: auditRequired -> Schedule Audit (Cross-Module)
                  -> auditResult=FAILED -> Supplier Corrective Action

10. Training Completion -> Update Source Workflows
    trainingProcess: sourceUpdateDelegate -> Mark training complete on triggering module
```

## 2.4 AI Integration Readiness Assessment

**Strengths (AI-Ready):**
- Well-defined BPMN workflows with clear decision gateways
- REST API layer suitable for tool invocation
- Existing cross-module automation chains (process chaining)
- Comprehensive audit trail infrastructure (ALCOA+)
- Electronic signature mechanism for human-in-the-loop
- Role-based access control with fine-grained permissions
- Dual workflow tracking (Flowable + application-level)

**Gaps (Need AI Infrastructure):**
- No event bus for real-time agent communication
- No vector database for semantic search/RAG
- No AI audit trail for explainability
- No agent memory/state persistence
- No LLM integration layer
- No document intelligence/OCR pipeline
- No predictive analytics infrastructure

---

# Chapter 3: Target AI Vision

## 3.1 From Workflow-Driven to Intelligence-Driven QMS

The current QMS-Pharma platform is **workflow-driven**: humans initiate records, manually investigate root causes, write investigation reports, and make decisions at each gateway. AI transforms this into an **intelligence-driven** system:

```
CURRENT STATE (Human-Driven)
============================
User creates deviation -> User classifies -> User investigates (days)
-> User writes report -> User assesses impact -> QA reviews -> QA approves

TARGET STATE (AI-Augmented)
============================
Event triggers deviation -> AI auto-classifies (seconds)
-> AI retrieves similar historical cases -> AI suggests root causes
-> AI drafts investigation report -> AI identifies impacted batches/SOPs/operators
-> AI recommends CAPA actions -> Human reviews & confirms (minutes)
-> AI generates audit-ready evidence package -> QA e-signs
```

## 3.2 Three Tiers of AI Integration

### Tier 1: AI Assistance (Months 1-4)
- Auto-classification of deviations, complaints, nonconformances
- Suggested root causes from historical pattern matching
- AI-drafted investigation reports and CAPA plans
- Intelligent form pre-fill based on context
- Document summarization and comparison

### Tier 2: AI Automation (Months 5-8)
- Cross-module workflow orchestration (Deviation -> CAPA -> Change automatically)
- Predictive analytics (recurrence probability, risk trending)
- Automated evidence compilation for audits and inspections
- Supplier risk scoring with early warning alerts
- Training gap detection and personalized learning paths

### Tier 3: AI Autonomy with Oversight (Months 9-12)
- Autonomous minor deviation handling (with human confirmation)
- Proactive compliance monitoring and inspection readiness
- Regulatory intelligence with guideline change impact analysis
- Knowledge graph-powered root cause correlation across modules
- Digital twin of quality operations with simulation capabilities

## 3.3 The Agent Ecosystem

```
                    +---------------------------+
                    |    AI Copilot (Chat UI)    |
                    |   Natural language QMS     |
                    +-------------+-------------+
                                  |
                    +-------------v-------------+
                    |    Supervisor Agent        |
                    |  Routes, coordinates,      |
                    |  maintains context          |
                    +---+---+---+---+---+---+---+
                        |   |   |   |   |   |
           +------------+   |   |   |   |   +------------+
           |                |   |   |   |                |
    +------v------+  +------v---v---v------+  +----------v----+
    | Deviation   |  | CAPA | Complaint    |  | Regulatory    |
    | Agent       |  | Agent| Agent        |  | Intelligence  |
    +------+------+  +------+------+-------+  | Agent         |
           |                |      |          +---------------+
    +------v------+  +------v------v-------+
    | Document    |  | Audit  | Risk       |
    | Agent       |  | Agent  | Agent      |
    +------+------+  +------+-+------+-----+
           |                |        |
    +------v------+  +------v------+ +------v------+
    | Training    |  | Supplier   | | Equipment   |
    | Agent       |  | Agent      | | Agent       |
    +------+------+  +------+-----+ +------+------+
           |                |              |
    +------v------+  +------v------+ +------v------+
    | Change      |  | Nonconf.   | | Calibration |
    | Control     |  | Agent      | | Agent       |
    | Agent       |  +------------+ +-------------+
    +-------------+

    Cross-Cutting Agents:
    +------------------+  +------------------+  +------------------+
    | Root Cause       |  | Predictive       |  | AI Workflow      |
    | Investigation    |  | Compliance       |  | Orchestrator     |
    | Agent            |  | Agent            |  |                  |
    +------------------+  +------------------+  +------------------+
```

## 3.4 Key Design Principles

1. **Human Sovereignty**: AI recommends, humans decide. All GxP-critical actions require human confirmation with electronic signatures.
2. **Explainable AI**: Every AI decision includes confidence scores, reasoning chains, and cited evidence. No "black box" decisions in regulated pharma.
3. **Audit Completeness**: All AI actions are logged in an AI-specific audit trail with model version, prompt hash, input/output, and confidence metrics.
4. **Graceful Degradation**: If AI services are unavailable, the system falls back to manual workflows seamlessly.
5. **Regulatory First**: Architecture decisions are driven by 21 CFR Part 11, EU Annex 11, and GAMP5 requirements, not convenience.
6. **Data Sovereignty**: All patient data, batch records, and GxP data remain within the organization's cloud boundary. No data leaves to external LLM providers without explicit consent and anonymization.

---

# Chapter 4: Google ADK Java Overview

## 4.1 What is Google ADK?

Google Agent Development Kit (ADK) is a framework for building, deploying, and managing AI agents. The Java SDK provides:

- **Agent Abstractions**: Define agents with instructions, tools, and sub-agents
- **Tool Framework**: Register Java methods as callable tools for LLM
- **Memory Management**: Persistent state across agent conversations
- **Session Management**: Track multi-turn interactions
- **Orchestration Patterns**: Sequential, parallel, and conditional agent routing
- **Model Integration**: Native Gemini support, extensible to other LLMs
- **Streaming**: Real-time response streaming for interactive use
- **Callbacks**: Pre/post execution hooks for audit logging

## 4.2 ADK Java Core Concepts

### 4.2.1 Agent Definition

```java
@Component
public class DeviationAgent {

    public Agent buildAgent() {
        return Agent.builder()
            .name("deviation_agent")
            .description("Handles deviation classification, investigation assistance, "
                + "and CAPA recommendation for pharmaceutical deviations")
            .model("gemini-2.5-pro")
            .instruction("""
                You are a pharmaceutical Deviation Management AI Agent.
                You operate within the QMS-Pharma eQMS platform.

                YOUR ROLE:
                - Classify deviations as Critical/Major/Minor based on GMP criteria
                - Suggest root causes from historical deviation data
                - Identify impacted batches, equipment, SOPs, and operators
                - Draft investigation reports following regulatory templates
                - Recommend whether CAPA is required
                - Predict recurrence probability

                CONSTRAINTS:
                - NEVER auto-approve or auto-close deviations
                - ALWAYS require human confirmation for classification decisions
                - ALWAYS cite evidence and confidence scores
                - Flag any potential patient safety impact immediately
                """)
            .tools(List.of(
                classifyDeviationTool,
                searchHistoricalDeviationsTool,
                getDeviationDetailsTool,
                getAffectedBatchesTool,
                draftInvestigationReportTool,
                recommendCapaTool
            ))
            .build();
    }
}
```

### 4.2.2 Tool Definition

```java
@Component
public class DeviationTools {

    @Tool(name = "search_historical_deviations",
          description = "Search for similar historical deviations by category, "
              + "equipment, product, area, or root cause keywords")
    public List<DeviationSummary> searchHistorical(
            @Param("query") String searchQuery,
            @Param("category") String category,
            @Param("limit") int maxResults) {
        // Calls existing DeviationService with vector similarity search
        return deviationSearchService.semanticSearch(searchQuery, category, maxResults);
    }

    @Tool(name = "classify_deviation",
          description = "Suggest deviation classification (Critical/Major/Minor) "
              + "based on deviation details and GMP impact criteria")
    public ClassificationSuggestion classifyDeviation(
            @Param("deviationId") String deviationId) {
        Deviation deviation = deviationService.getById(UUID.fromString(deviationId));
        // AI classification logic with confidence scoring
        return classificationEngine.classify(deviation);
    }
}
```

### 4.2.3 Multi-Agent Orchestration

```java
@Component
public class SupervisorAgent {

    public Agent buildAgent() {
        return Agent.builder()
            .name("supervisor_agent")
            .description("Routes QMS queries to specialized agents")
            .model("gemini-2.5-pro")
            .instruction("""
                You are the QMS Supervisor Agent. Route requests to the correct
                specialized agent based on the QMS module involved.
                If a request spans multiple modules, coordinate between agents.
                """)
            .subAgents(List.of(
                deviationAgent.buildAgent(),
                capaAgent.buildAgent(),
                complaintAgent.buildAgent(),
                auditAgent.buildAgent(),
                documentAgent.buildAgent(),
                trainingAgent.buildAgent(),
                supplierAgent.buildAgent(),
                equipmentAgent.buildAgent(),
                riskAgent.buildAgent(),
                changeControlAgent.buildAgent(),
                nonconformanceAgent.buildAgent(),
                regulatoryAgent.buildAgent(),
                predictiveComplianceAgent.buildAgent(),
                rootCauseAgent.buildAgent()
            ))
            .build();
    }
}
```

## 4.3 ADK Java vs. Alternative Frameworks

| Feature | Google ADK Java | LangChain4j | Spring AI | Semantic Kernel Java |
|---------|----------------|-------------|-----------|---------------------|
| Native Gemini | Yes | Partial | Yes | Partial |
| Multi-Agent | Built-in | Manual | No | Limited |
| MCP Support | Native | Plugin | Plugin | No |
| Memory | Built-in | Manual | No | Manual |
| Tool Framework | Annotation-driven | Builder pattern | Function calling | Plugin model |
| GCP Integration | Native | Manual | Manual | Manual |
| Session Mgmt | Built-in | Manual | No | Manual |
| Spring Boot | Compatible | Compatible | Native | Compatible |
| Production Ready | Yes | Yes | Preview | Preview |

**Decision: Google ADK Java** is selected because:
1. Native multi-agent orchestration eliminates custom routing code
2. Built-in Gemini integration with the existing GCP deployment
3. MCP server support for standardized tool connectivity
4. Session and memory management reduces custom infrastructure
5. Alignment with the existing GCP cloud deployment (Cloud Run, Cloud SQL, GCS)

---

# Chapter 5: Reference Architecture

## 5.1 System Architecture Diagram

```
+=========================================================================+
|                         PRESENTATION LAYER                               |
|  +----------+ +----------+ +----------+ +----------+ +-----------+       |
|  | shell-app| | capa-mfe | | dev-mfe  | | doc-mfe  | | AI Copilot|       |
|  | (4200)   | | (4201)   | | (4202)   | | (4204)   | | Chat UI   |       |
|  +----+-----+ +----+-----+ +----+-----+ +----+-----+ +-----+-----+       |
|       |             |            |            |             |             |
+=========================================================================+
        |             |            |            |             |
+=========================================================================+
|                         API GATEWAY LAYER                                |
|  +-------------------------------------------------------------------+   |
|  |  Spring Boot 3.5 API (port 8082)                                  |   |
|  |  /api/v1/capas  /api/v1/deviations  /api/v1/documents  ...        |   |
|  |  /api/v1/ai/chat  /api/v1/ai/agents/{agentId}/invoke              |   |
|  +---+-------+-------+-------+-------+-------+-------+--------------+   |
|      |       |       |       |       |       |       |                   |
+=========================================================================+
       |       |       |       |       |       |       |
+=========================================================================+
|                    AGENT ORCHESTRATION LAYER                             |
|                                                                          |
|  +------------------+     +---------------------+                        |
|  | Supervisor Agent |---->| Agent Router         |                       |
|  | (Google ADK)     |     | (Intent Detection)   |                       |
|  +--------+---------+     +----------+----------+                        |
|           |                          |                                    |
|  +--------v--------------------------v---------+                         |
|  |           Specialized Agent Pool             |                        |
|  | +----------+ +------+ +---------+ +-------+ |                        |
|  | | Deviation| | CAPA | |Complaint| | Audit | |                        |
|  | | Agent    | | Agent| | Agent   | | Agent | |                        |
|  | +----------+ +------+ +---------+ +-------+ |                        |
|  | +----------+ +------+ +---------+ +-------+ |                        |
|  | | Document | | Train| |Supplier | | Equip | |                        |
|  | | Agent    | | Agent| | Agent   | | Agent | |                        |
|  | +----------+ +------+ +---------+ +-------+ |                        |
|  | +----------+ +------+ +---------+ +-------+ |                        |
|  | | Risk     | | CC   | | NC      | | Reg.  | |                        |
|  | | Agent    | | Agent| | Agent   | | Intel | |                        |
|  | +----------+ +------+ +---------+ +-------+ |                        |
|  | +----------+ +------+ +---------+           |                        |
|  | |Root Cause| |Predict| |Workflow |           |                        |
|  | |Agent     | |Comply | |Orchest. |           |                        |
|  | +----------+ +------+ +---------+           |                        |
|  +----------------------------------------------+                        |
|                                                                          |
+=========================================================================+
       |       |       |       |       |       |
+=========================================================================+
|                      TOOL & MCP LAYER                                    |
|                                                                          |
|  +------------------+  +-------------------+  +--------------------+     |
|  | QMS REST Tools   |  | Workflow Tools    |  | Search Tools       |     |
|  | (CRUD operations)|  | (Flowable engine) |  | (Vector + Full-text)|    |
|  +------------------+  +-------------------+  +--------------------+     |
|  +------------------+  +-------------------+  +--------------------+     |
|  | Document Tools   |  | Analytics Tools   |  | Notification Tools |     |
|  | (GCS, OCR, parse)|  | (KPI, trends)     |  | (email, in-app)    |     |
|  +------------------+  +-------------------+  +--------------------+     |
|  +------------------+  +-------------------+                             |
|  | Human Approval   |  | External API      |                             |
|  | Tools (e-sign)   |  | Tools (FDA, WHO)  |                             |
|  +------------------+  +-------------------+                             |
|                                                                          |
+=========================================================================+
       |       |       |       |       |       |
+=========================================================================+
|                     INTELLIGENCE LAYER                                   |
|                                                                          |
|  +------------------+  +-------------------+  +--------------------+     |
|  | RAG Pipeline     |  | Knowledge Graph   |  | Embedding Service  |     |
|  | (Pharma KB)      |  | (Neo4j/JanusGraph)|  | (text-embedding)   |     |
|  +------------------+  +-------------------+  +--------------------+     |
|  +------------------+  +-------------------+  +--------------------+     |
|  | Prompt Templates |  | Classification    |  | Predictive Models  |     |
|  | (GxP-validated)  |  | Engine            |  | (Risk, Recurrence) |     |
|  +------------------+  +-------------------+  +--------------------+     |
|                                                                          |
+=========================================================================+
       |       |       |       |       |       |
+=========================================================================+
|                      DATA LAYER                                          |
|                                                                          |
|  +------------------+  +-------------------+  +--------------------+     |
|  | PostgreSQL 17    |  | pgvector          |  | Elasticsearch 8.x |     |
|  | (Operational DB) |  | (Vector Store)    |  | (Search & Analytics)|    |
|  | 60+ QMS tables   |  | Embeddings for    |  | Full-text search   |     |
|  | Flowable ACT_*   |  | RAG retrieval     |  | Trend analytics    |     |
|  +------------------+  +-------------------+  +--------------------+     |
|  +------------------+  +-------------------+  +--------------------+     |
|  | Google Cloud     |  | Redis             |  | Google Pub/Sub     |     |
|  | Storage (GCS)    |  | (Agent Cache &    |  | (Event Bus for     |     |
|  | Documents, SOPs  |  |  Session Store)   |  |  Agent Events)     |     |
|  +------------------+  +-------------------+  +--------------------+     |
|                                                                          |
+=========================================================================+
```

## 5.2 Request Flow: AI-Assisted Deviation Classification

```
1. User creates deviation via Angular UI
2. POST /api/v1/deviations -> DeviationController -> DeviationService.create()
3. Deviation saved to PostgreSQL, deviationProcess started in Flowable
4. Event published to Google Pub/Sub topic: "qms.deviation.created"

5. AI Event Listener picks up event
6. Supervisor Agent receives: "New deviation DEV-2026-042 created"
7. Supervisor routes to Deviation Agent

8. Deviation Agent executes tool chain:
   a. get_deviation_details(DEV-2026-042) -> fetches full record
   b. search_historical_deviations("contamination in mixing area") -> RAG search
   c. get_affected_batches(DEV-2026-042) -> batch impact analysis
   d. classify_deviation(DEV-2026-042) -> returns:
      {
        "suggestedClassification": "MAJOR",
        "confidence": 0.87,
        "reasoning": "Historical pattern shows 3 similar deviations in mixing area
                      in last 12 months. Product quality impact rated HIGH based on
                      affected batch proximity to release. No patient safety impact
                      identified. Matches FDA guidance for Major classification.",
        "similarCases": ["DEV-2025-018", "DEV-2025-031", "DEV-2024-089"],
        "recommendedActions": [
          "Immediate hold on batch B-2026-1847",
          "Environmental monitoring review for mixing area",
          "Equipment cleaning verification for mixer MX-003"
        ],
        "capaRecommendation": true,
        "recurrenceProbability": 0.34
      }

9. AI classification stored in ai_agent_audit_trail table
10. Notification sent to QA_REVIEWER: "AI suggests MAJOR classification for DEV-2026-042"
11. QA Reviewer opens deviation, sees AI suggestion with confidence and reasoning
12. QA Reviewer confirms/adjusts classification with electronic signature
13. Workflow advances to Investigation task
```

## 5.3 Data Flow Architecture

```
                    External Sources
                    +-----------+
                    | FDA/WHO   |
                    | Guideline |
                    | Updates   |
                    +-----+-----+
                          |
                    +-----v-----+
                    | Regulatory|
                    | Intel     |
                    | Agent     |
                    +-----+-----+
                          |
+----------+        +----v----+        +-----------+
| Angular  | -----> | Spring  | -----> | PostgreSQL|
| MFE UI   | <----- | Boot    | <----- | + pgvector|
+----------+   REST | API     |  JPA   +-----------+
                    +----+----+              |
                         |                   |
                    +----v----+        +-----v-----+
                    | Pub/Sub | -----> |Elasticsearch|
                    | Events  |        | (Analytics) |
                    +----+----+        +-----------+
                         |
                    +----v----+
                    | Agent   |
                    | Layer   |
                    | (ADK)   |
                    +----+----+
                         |
              +----------+-----------+
              |          |           |
         +----v---+ +---v----+ +---v----+
         | Gemini | | GCS    | | Redis  |
         | LLM    | | Docs   | | Cache  |
         +--------+ +--------+ +--------+
```

---

# Chapter 6: Multi-Agent AI Architecture

## 6.1 Agent Hierarchy

The agent ecosystem follows a **hierarchical multi-agent pattern** with three levels:

### Level 1: Orchestration Agents
- **Supervisor Agent** -- Routes requests, manages cross-agent coordination
- **AI Workflow Orchestrator** -- Handles multi-module workflow chains

### Level 2: Domain Agents (11 Module Agents)
- Deviation Agent, CAPA Agent, Complaint Agent, Audit Agent, Document Agent, Training Agent, Supplier Agent, Equipment Agent (includes Calibration), Nonconformance Agent, Risk Agent, Change Control Agent

### Level 3: Cross-Cutting Agents
- **Root Cause Investigation Agent** -- Shared RCA capability across modules
- **Predictive Compliance Agent** -- Inspection readiness and trend prediction
- **Regulatory Intelligence Agent** -- Guideline monitoring and impact analysis
- **AI Copilot** -- Natural language interface for all modules

## 6.2 Agent Communication Patterns

### 6.2.1 Request-Response (Synchronous)
Used for: User-initiated queries through AI Copilot

```
User: "What is the root cause trend for mixing area deviations?"
  -> AI Copilot -> Supervisor Agent
  -> Deviation Agent.searchHistorical("mixing area")
  -> Root Cause Agent.analyzeTrend(results)
  -> Response with trend chart and recommendations
```

### 6.2.2 Event-Driven (Asynchronous)
Used for: Automated AI actions triggered by workflow events

```
Pub/Sub Event: "qms.deviation.created"
  -> AI Event Listener
  -> Deviation Agent.autoClassify(deviationId)
  -> Store suggestion in ai_recommendations table
  -> Notification to QA_REVIEWER
```

### 6.2.3 Agent-to-Agent Delegation
Used for: Cross-module AI operations

```
Complaint Agent detects adverse event pattern
  -> Delegates to Regulatory Intelligence Agent
  -> Regulatory Agent checks FDA MedWatch requirements
  -> Returns reporting deadline and template
  -> Complaint Agent pre-fills regulatory report fields
```

### 6.2.4 Parallel Fan-Out
Used for: Impact analysis across modules

```
Deviation classified as CRITICAL
  -> Supervisor Agent fans out:
     [parallel]
     -> CAPA Agent: search for existing CAPAs on same root cause
     -> Risk Agent: update risk register with new occurrence
     -> Training Agent: check if affected operators are trained
     -> Equipment Agent: check calibration status of involved equipment
     -> Supplier Agent: check if materials from at-risk supplier
     [join]
  -> Supervisor Agent: compile impact summary
```

## 6.3 Agent State Machine

Each agent operates within a defined state machine:

```
+----------+     +-----------+     +-----------+     +----------+
|  IDLE    | --> | ANALYZING | --> | PROPOSING | --> | WAITING  |
|          |     | (Tool     |     | (Generate |     | (Human   |
|          |     |  Calls)   |     |  Suggest.)|     |  Review) |
+----------+     +-----------+     +-----------+     +----+-----+
     ^                                                     |
     |               +------------+                        |
     +---------------| COMPLETED  |<-----------------------+
                     | (Logged)   |    Human Confirms/Rejects
                     +------------+
```

**State Transitions:**
- IDLE -> ANALYZING: Triggered by event or user request
- ANALYZING -> PROPOSING: All tool calls completed, analysis done
- PROPOSING -> WAITING: Suggestion generated, awaiting human input
- WAITING -> COMPLETED: Human confirms/adjusts/rejects
- COMPLETED -> IDLE: Result logged, agent ready for next task
- Any State -> IDLE: Timeout or cancellation

## 6.4 Agent Registry

```java
@Configuration
public class AgentRegistryConfig {

    @Bean
    public AgentRegistry agentRegistry(
            SupervisorAgentBuilder supervisorAgent,
            DeviationAgentBuilder deviationAgent,
            CapaAgentBuilder capaAgent,
            ComplaintAgentBuilder complaintAgent,
            AuditAgentBuilder auditAgent,
            DocumentAgentBuilder documentAgent,
            TrainingAgentBuilder trainingAgent,
            SupplierAgentBuilder supplierAgent,
            EquipmentAgentBuilder equipmentAgent,
            NonconformanceAgentBuilder nonconformanceAgent,
            RiskAgentBuilder riskAgent,
            ChangeControlAgentBuilder changeControlAgent,
            RegulatoryIntelligenceAgentBuilder regulatoryAgent,
            PredictiveComplianceAgentBuilder predictiveAgent,
            RootCauseAgentBuilder rootCauseAgent,
            AiCopilotBuilder copilotAgent,
            WorkflowOrchestratorBuilder workflowOrchestrator) {

        AgentRegistry registry = new AgentRegistry();

        // Level 1: Orchestration
        registry.register("supervisor", supervisorAgent.build());
        registry.register("workflow_orchestrator", workflowOrchestrator.build());

        // Level 2: Domain Agents
        registry.register("deviation", deviationAgent.build());
        registry.register("capa", capaAgent.build());
        registry.register("complaint", complaintAgent.build());
        registry.register("audit", auditAgent.build());
        registry.register("document", documentAgent.build());
        registry.register("training", trainingAgent.build());
        registry.register("supplier", supplierAgent.build());
        registry.register("equipment", equipmentAgent.build());
        registry.register("nonconformance", nonconformanceAgent.build());
        registry.register("risk", riskAgent.build());
        registry.register("change_control", changeControlAgent.build());

        // Level 3: Cross-Cutting
        registry.register("regulatory_intelligence", regulatoryAgent.build());
        registry.register("predictive_compliance", predictiveAgent.build());
        registry.register("root_cause", rootCauseAgent.build());
        registry.register("copilot", copilotAgent.build());

        return registry;
    }
}
```

## 6.5 Agent Capability Matrix

| Agent | Classify | Investigate | Draft | Predict | Monitor | Cross-Module |
|-------|----------|-------------|-------|---------|---------|--------------|
| Deviation | Auto-classify Critical/Major/Minor | Suggest root causes, find similar cases | Investigation reports | Recurrence probability | Trend monitoring | -> CAPA, Risk, Training |
| CAPA | Priority assignment | RCA assistance (5-Why, Fishbone) | CAPA plans, action items | Effectiveness prediction | Overdue monitoring | -> Change, Training, Risk |
| Complaint | Severity, adverse event detection | Root cause from complaint details | Response letters | Product risk trending | Recall monitoring | -> Deviation, CAPA, Regulatory |
| Audit | Finding classification | Evidence compilation | Audit reports, checklists | Compliance risk scoring | Schedule optimization | -> CAPA, Deviation, Change |
| Document | Type classification | GxP terminology validation | SOP drafting, revision comparison | Review cycle prediction | Expiry/review alerts | -> Training, Change |
| Training | Gap detection | Competency analysis | Learning path generation | Compliance gap prediction | Expiry monitoring | -> Document, CAPA, Deviation |
| Supplier | Risk category scoring | Audit finding analysis | SCAR responses | Supply chain risk prediction | Certificate expiry alerts | -> Audit, CAPA, NC |
| Equipment | Criticality assessment | Failure pattern analysis | Qualification protocols | Predictive maintenance | Calibration due alerts | -> Deviation, CAPA, Change |
| NC | Classification (Critical/Major/Minor) | Material impact analysis | Disposition recommendations | Batch risk prediction | Hold monitoring | -> Deviation, CAPA, Supplier, Risk |
| Risk | Risk level scoring | Control effectiveness analysis | Risk register entries | RPN trend prediction | Periodic review alerts | -> CAPA, Change, Deviation |
| Change | Classification, impact pre-assessment | Regulatory impact analysis | Impact assessment reports | Implementation risk prediction | Implementation tracking | -> Document, Training, RA |
| Regulatory | Guideline classification | Impact analysis on QMS | Regulatory briefs | Inspection probability | FDA/WHO guideline monitoring | All modules |
| Predictive | Compliance score | Gap analysis | Inspection readiness reports | Inspection outcome prediction | Continuous monitoring | All modules |
| Root Cause | Method selection | Pattern matching, correlation | RCA reports | Recurrence prediction | Cross-module correlation | Deviation, CAPA, Complaint, NC |

---

# Chapter 7: Supervisor Agent & Agent Orchestrator

## 7.1 Supervisor Agent Architecture

The Supervisor Agent is the central routing intelligence. It determines which specialized agent(s) should handle each request based on intent detection and context analysis.

### 7.1.1 Agent Definition

```java
@Component
@RequiredArgsConstructor
public class SupervisorAgentBuilder {

    private final AgentRegistry agentRegistry;

    public Agent build() {
        return Agent.builder()
            .name("qms_supervisor")
            .description("Central QMS AI Supervisor that routes requests to "
                + "specialized pharmaceutical quality management agents")
            .model("gemini-2.5-pro")
            .instruction("""
                You are the QMS-Pharma Supervisor Agent. Your role is to:

                1. UNDERSTAND the user's intent and the QMS module(s) involved
                2. ROUTE to the correct specialized agent(s)
                3. COORDINATE multi-agent responses when requests span modules
                4. SYNTHESIZE responses from multiple agents into coherent answers
                5. MAINTAIN context across the conversation

                ROUTING RULES:
                - Deviation questions -> deviation_agent
                - CAPA questions -> capa_agent
                - Complaint handling -> complaint_agent
                - Audit-related -> audit_agent
                - Document/SOP questions -> document_agent
                - Training questions -> training_agent
                - Supplier quality -> supplier_agent
                - Equipment/Calibration -> equipment_agent
                - Nonconformance -> nonconformance_agent
                - Risk management -> risk_agent
                - Change control -> change_control_agent
                - Regulatory questions -> regulatory_intelligence_agent
                - Compliance predictions -> predictive_compliance_agent
                - Root cause analysis -> root_cause_agent

                MULTI-MODULE ROUTING:
                - If a request involves cross-module chains (e.g., "deviation that
                  needs CAPA"), coordinate between the relevant agents
                - For impact analysis, fan out to all potentially affected modules
                - Always check for upstream/downstream effects

                SAFETY RULES:
                - Never bypass human approval for GxP decisions
                - Always include confidence scores in responses
                - Flag patient safety concerns immediately
                - Escalate to human when confidence is below 0.7
                """)
            .subAgents(agentRegistry.getAllAgents())
            .build();
    }
}
```

### 7.1.2 Intent Detection and Routing

```java
@Service
public class IntentRouter {

    private static final Map<String, List<String>> MODULE_KEYWORDS = Map.ofEntries(
        Map.entry("deviation", List.of("deviation", "deviate", "non-conformity",
            "out of spec", "OOS", "investigation", "classify")),
        Map.entry("capa", List.of("capa", "corrective action", "preventive action",
            "root cause", "RCA", "five why", "fishbone", "effectiveness")),
        Map.entry("complaint", List.of("complaint", "adverse event", "customer feedback",
            "product quality issue", "recall", "field alert", "MedWatch")),
        Map.entry("audit", List.of("audit", "inspection", "finding", "observation",
            "checklist", "auditor", "audit plan")),
        Map.entry("document", List.of("document", "SOP", "procedure", "revision",
            "document review", "version control", "work instruction")),
        Map.entry("training", List.of("training", "competency", "curriculum",
            "retraining", "training matrix", "qualification")),
        Map.entry("supplier", List.of("supplier", "vendor", "qualification",
            "SCAR", "scorecard", "supply chain")),
        Map.entry("equipment", List.of("equipment", "calibration", "maintenance",
            "IQ", "OQ", "PQ", "qualification", "instrument")),
        Map.entry("nonconformance", List.of("nonconformance", "NC", "material hold",
            "quarantine", "disposition", "reject", "rework")),
        Map.entry("risk", List.of("risk", "FMEA", "risk assessment", "RPN",
            "severity", "occurrence", "detectability", "risk register")),
        Map.entry("change_control", List.of("change control", "change request",
            "impact assessment", "implementation", "regulatory filing")),
        Map.entry("regulatory", List.of("regulatory", "FDA", "WHO", "Schedule M",
            "GMP", "guideline", "compliance", "inspection readiness")),
        Map.entry("predictive", List.of("predict", "forecast", "trend",
            "analytics", "dashboard", "KPI", "compliance score"))
    );

    public List<String> detectTargetAgents(String userQuery) {
        String lowerQuery = userQuery.toLowerCase();
        return MODULE_KEYWORDS.entrySet().stream()
            .filter(entry -> entry.getValue().stream()
                .anyMatch(lowerQuery::contains))
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }
}
```

## 7.2 AI Workflow Orchestrator

The Workflow Orchestrator handles multi-step, cross-module AI operations that mirror the existing BPMN process chains.

### 7.2.1 Orchestration Chains

```java
@Component
public class WorkflowOrchestratorBuilder {

    public Agent build() {
        return Agent.builder()
            .name("workflow_orchestrator")
            .description("Orchestrates cross-module AI workflows following "
                + "established QMS process chains")
            .model("gemini-2.5-pro")
            .instruction("""
                You orchestrate multi-module QMS workflows. Known chains:

                CHAIN 1: Deviation -> CAPA
                When deviation disposition requires CAPA:
                1. Deviation Agent classifies and investigates
                2. If CAPA recommended, delegate to CAPA Agent
                3. CAPA Agent drafts CAPA plan based on deviation findings
                4. Link CAPA to deviation via sourceType=DEVIATION

                CHAIN 2: Complaint -> Investigation -> CAPA -> Recall Assessment
                When complaint received:
                1. Complaint Agent assesses severity, adverse event flags
                2. If investigation required, Root Cause Agent assists
                3. If CAPA required, CAPA Agent creates linked record
                4. If recall assessment needed, flag for immediate human review

                CHAIN 3: Audit Finding -> CAPA / Deviation / Change
                When audit findings reviewed:
                1. Audit Agent classifies findings
                2. For Critical/Major findings, CAPA Agent creates linked CAPA
                3. If systemic issue, Deviation Agent creates deviation
                4. If process change needed, Change Control Agent drafts request

                CHAIN 4: Equipment Cal Failure -> Deviation -> CAPA
                When calibration fails:
                1. Equipment Agent assesses impact on affected batches
                2. Deviation Agent creates deviation (CALIBRATION_FAILURE)
                3. If CAPA required, CAPA Agent creates linked CAPA

                CHAIN 5: NC -> Supplier SCAR -> CAPA -> Risk Update
                When nonconformance detected:
                1. NC Agent classifies and investigates
                2. If supplier-related, Supplier Agent issues SCAR
                3. If CAPA required, CAPA Agent creates linked CAPA
                4. Risk Agent updates risk register

                CHAIN 6: Document Approval -> Training Assignment
                When document approved:
                1. Document Agent triggers training identification
                2. Training Agent identifies affected personnel
                3. Training assignments created automatically

                CHAIN 7: Change Control -> Document Revision -> Training
                When change approved:
                1. Change Control Agent identifies affected documents
                2. Document Agent initiates revision workflow
                3. Training Agent identifies retraining needs

                CHAIN 8: Risk Assessment -> Change Request / CAPA
                When risk is unacceptable:
                1. Risk Agent escalates with RPN analysis
                2. If process change needed, Change Control Agent creates request
                3. If corrective action needed, CAPA Agent creates CAPA

                CHAIN 9: Supplier Qualification -> Audit -> CAPA
                When supplier qualification fails:
                1. Supplier Agent flags qualification failure
                2. Audit Agent creates/links supplier audit
                3. If corrective action needed, CAPA Agent creates supplier CAPA

                CHAIN 10: Training Completion -> Source Workflow Update
                When training completed:
                1. Training Agent marks completion
                2. Updates source module (Deviation, CAPA, Change, Document)
                3. Notifies source workflow of readiness

                ALWAYS: Log all cross-module actions to AI audit trail.
                NEVER: Auto-execute without human confirmation for GxP steps.
                """)
            .tools(List.of(
                createCrossModuleLinkTool,
                getRelatedRecordsTool,
                checkWorkflowStatusTool,
                triggerDownstreamWorkflowTool
            ))
            .build();
    }
}
```

## 7.3 Session Management

```java
@Service
public class AgentSessionService {

    private final SessionService sessionService; // Google ADK SessionService
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Creates or retrieves an agent session for the current user.
     * Sessions persist across conversations for context continuity.
     */
    public Session getOrCreateSession(String userId, String agentName) {
        String sessionKey = "agent_session:" + userId + ":" + agentName;

        // Check for existing active session
        Session existing = sessionService.getSession(sessionKey);
        if (existing != null && !existing.isExpired()) {
            return existing;
        }

        // Create new session with user context
        User user = userService.findById(UUID.fromString(userId));
        Map<String, Object> context = Map.of(
            "userId", userId,
            "userName", user.getFullName(),
            "roles", user.getRoles().stream()
                .map(UserRole::getRole).map(ApplicationRole::getName)
                .collect(Collectors.toList()),
            "plantSiteId", user.getDefaultPlantSite().getId().toString(),
            "department", user.getDepartment().getName(),
            "permissions", permissionService.getUserPermissions(user)
        );

        return sessionService.createSession(sessionKey, context);
    }
}
```

---

# Chapter 8: Deviation AI Agent

## 8.1 Agent Purpose

The Deviation AI Agent automates and accelerates the deviation management lifecycle, from initial classification through investigation assistance to closure recommendation. It integrates deeply with the existing `deviationProcess` BPMN workflow.

## 8.2 Agent Capabilities

### 8.2.1 Auto-Classification

When a deviation is reported, the agent analyzes the description, affected area, equipment, product, and batch information to suggest a classification:

```java
@Tool(name = "classify_deviation",
      description = "Analyze deviation details and suggest classification "
          + "(Critical/Major/Minor) with confidence score and reasoning")
public ClassificationSuggestion classifyDeviation(
        @Param("deviationId") String deviationId) {

    Deviation deviation = deviationService.getById(UUID.fromString(deviationId));

    // Build classification context
    ClassificationContext context = ClassificationContext.builder()
        .description(deviation.getDescription())
        .category(deviation.getCategory().name())
        .type(deviation.getType().name())
        .areaOfOccurrence(deviation.getAreaOfOccurrence())
        .equipmentInvolved(deviation.getEquipmentInvolved())
        .productName(deviation.getProduct() != null ?
            deviation.getProduct().getName() : null)
        .affectedBatches(deviation.getAffectedBatches().stream()
            .map(b -> b.getBatchNumber()).collect(Collectors.toList()))
        .gmpImpact(deviation.getImpactOnGmp())
        .patientSafetyImpact(deviation.getImpactOnPatientSafety())
        .regulatoryImpact(deviation.getImpactOnRegulatory())
        .build();

    // Retrieve similar historical deviations via vector search
    List<DeviationSummary> similarCases = vectorSearchService
        .searchSimilarDeviations(deviation.getDescription(), 10);

    // Historical classification distribution for similar cases
    Map<String, Long> historicalClassifications = similarCases.stream()
        .collect(Collectors.groupingBy(
            d -> d.getClassification().name(),
            Collectors.counting()));

    // Build AI prompt with GMP classification criteria
    String classificationResult = llmService.classify(context,
        similarCases, GMP_CLASSIFICATION_CRITERIA);

    return ClassificationSuggestion.builder()
        .suggestedClassification(classificationResult.classification())
        .confidence(classificationResult.confidence())
        .reasoning(classificationResult.reasoning())
        .gmpCriteria(classificationResult.applicableCriteria())
        .similarCases(similarCases.stream().limit(5)
            .map(this::toSummary).collect(Collectors.toList()))
        .historicalDistribution(historicalClassifications)
        .patientSafetyFlag(classificationResult.patientSafetyImpact())
        .build();
}
```

### 8.2.2 Root Cause Suggestion

```java
@Tool(name = "suggest_root_causes",
      description = "Analyze deviation and suggest probable root causes based on "
          + "historical patterns, equipment history, and process knowledge")
public RootCauseSuggestion suggestRootCauses(
        @Param("deviationId") String deviationId) {

    Deviation deviation = deviationService.getById(UUID.fromString(deviationId));

    // 1. Vector search for similar investigated deviations
    List<DeviationWithRCA> historicalRCAs = vectorSearchService
        .searchSimilarInvestigatedDeviations(deviation.getDescription(), 20);

    // 2. Equipment history analysis (if equipment involved)
    EquipmentHistory equipHistory = null;
    if (deviation.getEquipmentInvolved() != null) {
        equipHistory = equipmentService
            .getMaintenanceAndCalibrationHistory(deviation.getEquipmentInvolved());
    }

    // 3. Process parameter trending (if batch-related)
    BatchTrend batchTrend = null;
    if (!deviation.getAffectedBatches().isEmpty()) {
        batchTrend = analyticsService
            .getBatchTrend(deviation.getAffectedBatches());
    }

    // 4. Personnel training status
    List<TrainingGap> trainingGaps = trainingService
        .checkTrainingGaps(deviation.getAreaOfOccurrence(),
            deviation.getDepartment());

    // 5. RAG retrieval for relevant SOPs and guidelines
    List<DocumentChunk> relevantSOPs = ragService
        .retrieveRelevantDocuments(deviation.getDescription(),
            "SOP", "WORK_INSTRUCTION");

    // Generate root cause suggestions using LLM
    return llmService.suggestRootCauses(
        deviation, historicalRCAs, equipHistory,
        batchTrend, trainingGaps, relevantSOPs);
}
```

### 8.2.3 Impact Analysis

```java
@Tool(name = "analyze_deviation_impact",
      description = "Identify all impacted batches, products, equipment, SOPs, "
          + "operators, and suppliers for a deviation")
public ImpactAnalysis analyzeImpact(
        @Param("deviationId") String deviationId) {

    Deviation deviation = deviationService.getById(UUID.fromString(deviationId));

    ImpactAnalysis.Builder analysis = ImpactAnalysis.builder();

    // 1. Affected batches (direct and potentially affected)
    List<Batch> directBatches = deviation.getAffectedBatches().stream()
        .map(DeviationAffectedBatch::getBatch)
        .collect(Collectors.toList());
    List<Batch> potentialBatches = batchService
        .findBatchesByEquipmentAndTimeWindow(
            deviation.getEquipmentInvolved(),
            deviation.getOccurrenceDate().minusDays(7),
            deviation.getOccurrenceDate());
    analysis.directBatches(directBatches)
        .potentiallyAffectedBatches(potentialBatches);

    // 2. Affected products
    Set<Product> products = Stream.concat(
            directBatches.stream(), potentialBatches.stream())
        .map(Batch::getProduct).filter(Objects::nonNull)
        .collect(Collectors.toSet());
    analysis.affectedProducts(products);

    // 3. Related equipment
    if (deviation.getEquipmentInvolved() != null) {
        Equipment equip = equipmentService
            .findByName(deviation.getEquipmentInvolved());
        analysis.equipment(equip)
            .lastCalibrationDate(equip.getLastCalibrationDate())
            .lastMaintenanceDate(equip.getLastMaintenanceDate())
            .calibrationStatus(equip.getCalibrationStatus());
    }

    // 4. Affected SOPs
    List<Document> affectedSOPs = documentService
        .findByAreaAndProcess(deviation.getAreaOfOccurrence(),
            deviation.getCategory().name());
    analysis.affectedSOPs(affectedSOPs);

    // 5. Personnel involved
    List<User> operatorsInArea = userService
        .findByDepartmentAndRole(deviation.getDepartment(),
            "OPERATOR");
    analysis.personnelInvolved(operatorsInArea);

    // 6. Supplier impact
    if (deviation.getCategory() == DeviationCategory.MATERIAL) {
        List<Supplier> suppliers = supplierService
            .findBySupppliedMaterial(deviation.getMaterialInvolved());
        analysis.relatedSuppliers(suppliers);
    }

    return analysis.build();
}
```

### 8.2.4 Investigation Report Drafting

```java
@Tool(name = "draft_investigation_report",
      description = "Generate a GMP-compliant investigation report draft "
          + "based on deviation details, root cause analysis, and impact assessment")
public InvestigationReport draftReport(
        @Param("deviationId") String deviationId) {

    Deviation deviation = deviationService.getById(UUID.fromString(deviationId));

    // Gather all investigation data
    DeviationInvestigation investigation = deviation.getInvestigation();
    DeviationImpactAssessment impact = deviation.getImpactAssessment();
    List<DeviationImmediateAction> actions = deviation.getImmediateActions();

    // RAG retrieval for report template and regulatory language
    String reportTemplate = ragService.getTemplate("DEVIATION_INVESTIGATION_REPORT");
    List<DocumentChunk> regulatoryGuidance = ragService
        .retrieveRelevantDocuments("deviation investigation report",
            "GUIDELINE", "STANDARD");

    // Generate report using LLM with validated template
    return llmService.generateReport(
        reportTemplate,
        Map.of(
            "deviation", deviation,
            "investigation", investigation,
            "impact", impact,
            "immediateActions", actions,
            "regulatoryGuidance", regulatoryGuidance
        ));
}
```

### 8.2.5 CAPA Recommendation

```java
@Tool(name = "recommend_capa",
      description = "Analyze whether CAPA is required for a deviation and suggest "
          + "CAPA type, priority, and initial action items")
public CapaRecommendation recommendCapa(
        @Param("deviationId") String deviationId) {

    Deviation deviation = deviationService.getById(UUID.fromString(deviationId));

    // Decision criteria for CAPA requirement
    boolean capaRequired = evaluateCapaNecessity(deviation);

    if (!capaRequired) {
        return CapaRecommendation.builder()
            .capaRequired(false)
            .reasoning("Deviation classified as Minor with no recurring pattern. "
                + "Immediate actions are sufficient.")
            .build();
    }

    // Historical CAPA effectiveness for similar root causes
    List<CapaSummary> historicalCapas = vectorSearchService
        .searchSimilarCapas(deviation.getDescription(), 10);

    // Suggest CAPA details
    return CapaRecommendation.builder()
        .capaRequired(true)
        .suggestedType(deviation.getClassification() == DeviationClassification.CRITICAL
            ? CapaType.CORRECTIVE_AND_PREVENTIVE : CapaType.CORRECTIVE)
        .suggestedPriority(mapClassificationToPriority(deviation.getClassification()))
        .suggestedActions(generateSuggestedActions(deviation, historicalCapas))
        .historicalEffectiveness(calculateHistoricalEffectiveness(historicalCapas))
        .recurrenceProbability(predictRecurrence(deviation))
        .confidence(0.85)
        .reasoning("Classification is " + deviation.getClassification()
            + ". Historical data shows " + historicalCapas.size()
            + " similar cases with average effectiveness of "
            + calculateHistoricalEffectiveness(historicalCapas) + "%.")
        .build();
}
```

## 8.3 Deviation Agent Workflow Integration

```
Existing BPMN Workflow          AI Agent Touchpoints
========================        =========================
Deviation Reported       -----> [AI] Auto-classify suggestion
                                [AI] Similar case retrieval
QA Review & Classification <--- [AI] Present classification with confidence
                                [Human] Confirm/adjust classification (E-Sig)
Root Cause Investigation  -----> [AI] Suggest root causes
                                [AI] Retrieve relevant SOPs/guidelines
                                [AI] Draft investigation report
                         <----- [Human] Review/edit investigation findings
Impact Assessment         -----> [AI] Auto-populate impact matrix
                                [AI] Identify all affected batches/products
                         <----- [Human] Confirm impact ratings
Disposition Decision      -----> [AI] Recommend disposition based on impact
                                [AI] Recommend CAPA yes/no with reasoning
                         <----- [Human] E-sign disposition decision
CAPA Initiation           -----> [AI] Pre-fill CAPA with deviation data
                                [AI] Suggest CAPA actions from history
QA Final Review           -----> [AI] Generate closure summary
                                [AI] Validate all required fields complete
                         <----- [Human] E-sign closure
```

## 8.4 Deviation Agent Prompt Template

```
You are the Deviation Management AI Agent for {organizationName}.

CONTEXT:
- Plant Site: {plantSiteName}
- Department: {departmentName}
- User Role: {userRole}
- Current Date: {currentDate}

DEVIATION DETAILS:
- Number: {deviationNumber}
- Status: {status}
- Category: {category}
- Type: {type}
- Description: {description}
- Area: {areaOfOccurrence}
- Equipment: {equipmentInvolved}
- Reported Date: {reportedDate}
- Affected Batches: {affectedBatches}

HISTORICAL CONTEXT:
{similarDeviations}

GMP CLASSIFICATION CRITERIA:
- CRITICAL: Direct impact on product quality or patient safety. Potential for
  batch recall. Regulatory notification may be required. Examples: sterility
  breach, cross-contamination, data integrity failure.
- MAJOR: Significant deviation from GMP but no direct patient safety impact.
  May affect product quality if not corrected. Examples: equipment malfunction
  during production, environmental excursion, procedural deviation.
- MINOR: Deviation with no direct impact on product quality or patient safety.
  Can be corrected through immediate actions. Examples: documentation errors,
  minor procedural deviations, cosmetic issues.

INSTRUCTIONS:
1. Classify this deviation using the GMP criteria above
2. Provide confidence score (0.0 to 1.0)
3. List all applicable GMP criteria that support your classification
4. Identify similar historical cases and their outcomes
5. Flag any patient safety concerns
6. Recommend immediate actions if applicable
7. State whether CAPA is likely required
```

---

# Chapter 9: CAPA AI Agent

## 9.1 Agent Purpose

The CAPA AI Agent accelerates the Corrective and Preventive Action lifecycle by assisting with root cause analysis, action planning, effectiveness monitoring, and recurrence prevention. It integrates with the `capaProcess` BPMN workflow.

## 9.2 Agent Capabilities

### 9.2.1 RCA Assistance (5-Why & Fishbone)

```java
@Tool(name = "assist_five_why_analysis",
      description = "Guide the user through 5-Why root cause analysis by suggesting "
          + "progressive 'why' questions based on the CAPA context and historical data")
public FiveWhyAssistance assistFiveWhy(
        @Param("capaId") String capaId,
        @Param("currentLevel") int currentLevel,
        @Param("previousAnswer") String previousAnswer) {

    Capa capa = capaService.getById(UUID.fromString(capaId));

    // Get existing five-why entries if any
    List<CapaFiveWhyEntry> existingEntries = capa.getRootCauseAnalysis() != null
        ? capa.getRootCauseAnalysis().getFiveWhyEntries()
        : List.of();

    // Historical 5-why analyses for similar CAPAs
    List<FiveWhyPattern> historicalPatterns = vectorSearchService
        .searchSimilarFiveWhyPatterns(capa.getDescription(), 10);

    // Generate next "why" question suggestion
    return llmService.suggestNextWhy(
        capa, existingEntries, currentLevel,
        previousAnswer, historicalPatterns);
}

@Tool(name = "assist_fishbone_analysis",
      description = "Generate Ishikawa/Fishbone diagram categories and potential "
          + "causes for each category based on CAPA context")
public FishboneAssistance assistFishbone(
        @Param("capaId") String capaId) {

    Capa capa = capaService.getById(UUID.fromString(capaId));

    // Standard 6M categories for pharma
    List<String> categories = List.of(
        "Man (Personnel)", "Machine (Equipment)", "Method (Process)",
        "Material", "Measurement", "Mother Nature (Environment)");

    // For each category, suggest potential causes
    Map<String, List<PotentialCause>> categorizedCauses = new LinkedHashMap<>();
    for (String category : categories) {
        List<PotentialCause> causes = llmService.suggestFishboneCauses(
            capa, category,
            vectorSearchService.searchCausesByCategory(
                capa.getDescription(), category, 5));
        categorizedCauses.put(category, causes);
    }

    return FishboneAssistance.builder()
        .categories(categorizedCauses)
        .mostLikelyCategory(identifyMostLikelyCategory(categorizedCauses))
        .confidence(0.82)
        .build();
}
```

### 9.2.2 Action Plan Generation

```java
@Tool(name = "generate_capa_action_plan",
      description = "Generate suggested corrective and preventive actions based on "
          + "identified root cause, risk assessment, and historical CAPA effectiveness")
public ActionPlanSuggestion generateActionPlan(
        @Param("capaId") String capaId) {

    Capa capa = capaService.getById(UUID.fromString(capaId));
    CapaRootCauseAnalysis rca = capa.getRootCauseAnalysis();
    CapaRiskAssessment risk = capa.getRiskAssessment();

    // Historical actions that were effective for similar root causes
    List<EffectiveAction> historicalActions = vectorSearchService
        .searchEffectiveActions(rca.getRootCauses(), 15);

    // Generate action suggestions
    ActionPlanSuggestion plan = llmService.generateActionPlan(
        capa, rca, risk, historicalActions);

    // Each action includes:
    // - Type: CORRECTIVE or PREVENTIVE
    // - Description
    // - Suggested assignee role
    // - Estimated due date
    // - Verification criteria
    // - Historical effectiveness rate for similar actions
    return plan;
}
```

### 9.2.3 Effectiveness Prediction

```java
@Tool(name = "predict_capa_effectiveness",
      description = "Predict the likely effectiveness of planned CAPA actions based "
          + "on historical outcomes for similar root causes and action types")
public EffectivenessPrediction predictEffectiveness(
        @Param("capaId") String capaId) {

    Capa capa = capaService.getById(UUID.fromString(capaId));
    List<CapaAction> plannedActions = capa.getActions();

    // Historical effectiveness data
    List<CapaOutcome> historicalOutcomes = analyticsService
        .getCapaOutcomes(capa.getSourceType(), capa.getRootCauseAnalysis());

    // Calculate prediction
    double effectivenessProbability = predictiveModel
        .predictCapaEffectiveness(capa, plannedActions, historicalOutcomes);

    List<String> riskFactors = identifyRiskFactors(capa, plannedActions);
    List<String> recommendations = generateImprovements(
        effectivenessProbability, riskFactors);

    return EffectivenessPrediction.builder()
        .predictedEffectiveness(effectivenessProbability)
        .confidence(0.78)
        .riskFactors(riskFactors)
        .recommendations(recommendations)
        .historicalBenchmark(calculateBenchmark(historicalOutcomes))
        .build();
}
```

### 9.2.4 Recurrence Monitoring

```java
@Tool(name = "check_capa_recurrence",
      description = "Check if a closed CAPA's root cause has recurred in any module "
          + "(deviations, complaints, nonconformances, audit findings)")
public RecurrenceReport checkRecurrence(
        @Param("capaId") String capaId) {

    Capa capa = capaService.getById(UUID.fromString(capaId));
    LocalDateTime closedDate = capa.getActualCompletionDate();

    // Search across all modules for recurrence after CAPA closure
    List<RecurrenceMatch> matches = new ArrayList<>();

    // Check deviations
    matches.addAll(deviationRepository
        .findByRootCauseSimilarAndDateAfter(
            capa.getRootCauseAnalysis().getRootCauses(), closedDate)
        .stream().map(d -> new RecurrenceMatch("DEVIATION", d.getDeviationNumber(),
            d.getDescription(), d.getReportedDate()))
        .collect(Collectors.toList()));

    // Check complaints
    matches.addAll(complaintRepository
        .findBySimilarIssueAfter(capa.getDescription(), closedDate)
        .stream().map(c -> new RecurrenceMatch("COMPLAINT", c.getComplaintNumber(),
            c.getDescription(), c.getReceivedDate()))
        .collect(Collectors.toList()));

    // Check nonconformances
    matches.addAll(ncRepository
        .findBySimilarCauseAfter(capa.getDescription(), closedDate)
        .stream().map(nc -> new RecurrenceMatch("NONCONFORMANCE", nc.getNcNumber(),
            nc.getDescription(), nc.getIdentifiedDate()))
        .collect(Collectors.toList()));

    return RecurrenceReport.builder()
        .capaNumber(capa.getCapaNumber())
        .originalRootCause(capa.getRootCauseAnalysis().getRootCauses())
        .closedDate(closedDate)
        .recurrenceDetected(!matches.isEmpty())
        .matches(matches)
        .recommendation(matches.isEmpty()
            ? "No recurrence detected. CAPA appears effective."
            : "RECURRENCE DETECTED. Recommend reopening CAPA or creating "
              + "new preventive CAPA with enhanced controls.")
        .build();
}
```

## 9.3 CAPA Agent Workflow Integration

```
Existing BPMN Workflow          AI Agent Touchpoints
========================        =========================
CAPA Initiated             -----> [AI] Pre-fill from source (Deviation/Complaint/Audit)
                                  [AI] Suggest priority based on source severity
QA Review                  -----> [AI] Validate completeness, flag gaps
                           <----- [Human] Approve/Reject CAPA initiation
Investigation (RCA)        -----> [AI] 5-Why question guidance
                                  [AI] Fishbone category population
                                  [AI] Historical root cause pattern matching
                           <----- [Human] Confirm root cause
Risk Assessment            -----> [AI] Suggest severity/occurrence/detection scores
                                  [AI] Calculate and interpret RPN
                           <----- [Human] Confirm risk scores
Action Planning            -----> [AI] Generate action plan from historical data
                                  [AI] Suggest corrective + preventive actions
                                  [AI] Estimate effectiveness probability
                           <----- [Human] Approve/modify action plan
Action Execution (R3/P7D)  -----> [AI] Monitor progress, predict delays
                                  [AI] Remind overdue actions
Effectiveness Check        -----> [AI] Predict effectiveness outcome
                                  [AI] Check for recurrence across modules
                           <----- [Human] Confirm effective/not effective
    [NOT EFFECTIVE]        -----> [AI] Analyze why ineffective
                                  [AI] Suggest enhanced actions (loop back)
QA Approval                -----> [AI] Generate closure summary
                                  [AI] Validate all closure rules met
                           <----- [Human] E-sign closure
Post-Closure               -----> [AI] Periodic recurrence monitoring
                                  [AI] Alert if similar issues detected
```

---

# Chapter 10: Complaint AI Agent

## 10.1 Agent Purpose

The Complaint AI Agent handles pharmaceutical complaint processing with focus on adverse event detection, regulatory reporting assessment, recall risk evaluation, and customer response generation. It integrates with the `complaintProcess` BPMN workflow.

## 10.2 Agent Capabilities

### 10.2.1 Complaint Triage and Adverse Event Detection

```java
@Tool(name = "triage_complaint",
      description = "Assess complaint severity, classify type, detect potential "
          + "adverse events, and determine regulatory reporting requirements")
public ComplaintTriage triageComplaint(
        @Param("complaintId") String complaintId) {

    Complaint complaint = complaintService.getById(UUID.fromString(complaintId));

    // 1. Classify complaint type and severity
    ComplaintClassification classification = llmService.classifyComplaint(
        complaint.getDescription(),
        complaint.getProductName(),
        complaint.getComplaintType());

    // 2. Adverse event detection using NLP
    AdverseEventAssessment aeAssessment = adverseEventDetector.assess(
        complaint.getDescription(),
        complaint.getPatientDetails(),
        complaint.getMedicalTerms());

    // 3. Regulatory reporting assessment
    RegulatoryReporting reporting = RegulatoryReporting.builder()
        .isMedWatchRequired(aeAssessment.isAdverseEvent()
            && aeAssessment.getSeverity().isSerious())
        .reportingDeadline(aeAssessment.isAdverseEvent()
            ? complaint.getReceivedDate().plusDays(15) : null)
        .reportingAgencies(determineReportingAgencies(
            complaint, aeAssessment))
        .build();

    // 4. Historical complaint pattern analysis
    List<ComplaintSummary> similarComplaints = vectorSearchService
        .searchSimilarComplaints(complaint.getDescription(),
            complaint.getProductCode(), 15);

    // 5. Recall risk assessment
    RecallRisk recallRisk = assessRecallRisk(
        complaint, classification, similarComplaints);

    return ComplaintTriage.builder()
        .suggestedClassification(classification.getClassification())
        .suggestedType(classification.getComplaintType())
        .adverseEventDetected(aeAssessment.isAdverseEvent())
        .adverseEventSeverity(aeAssessment.getSeverity())
        .regulatoryReporting(reporting)
        .recallRisk(recallRisk)
        .investigationRequired(classification.getSeverity() != Severity.LOW
            || aeAssessment.isAdverseEvent())
        .similarComplaints(similarComplaints)
        .confidence(classification.getConfidence())
        .reasoning(classification.getReasoning())
        .urgencyFlags(buildUrgencyFlags(aeAssessment, recallRisk))
        .build();
}
```

### 10.2.2 Complaint Trending and Pattern Detection

```java
@Tool(name = "analyze_complaint_trends",
      description = "Analyze complaint trends by product, type, batch, and time "
          + "period to detect emerging quality signals")
public ComplaintTrendAnalysis analyzeTrends(
        @Param("productCode") String productCode,
        @Param("months") int lookbackMonths) {

    LocalDate startDate = LocalDate.now().minusMonths(lookbackMonths);

    // Complaint volume trending
    List<ComplaintTrendPoint> volumeTrend = analyticsService
        .getComplaintVolumeTrend(productCode, startDate);

    // Category distribution
    Map<String, Long> categoryDistribution = analyticsService
        .getComplaintCategoryDistribution(productCode, startDate);

    // Batch correlation (do specific batches have more complaints?)
    List<BatchComplaintCorrelation> batchCorrelation = analyticsService
        .getBatchComplaintCorrelation(productCode, startDate);

    // Detect statistical signals (SPC-style)
    List<QualitySignal> signals = signalDetector
        .detectSignals(volumeTrend, categoryDistribution);

    // AI interpretation
    String interpretation = llmService.interpretComplaintTrends(
        volumeTrend, categoryDistribution, batchCorrelation, signals);

    return ComplaintTrendAnalysis.builder()
        .productCode(productCode)
        .period(startDate + " to " + LocalDate.now())
        .volumeTrend(volumeTrend)
        .categoryDistribution(categoryDistribution)
        .batchCorrelation(batchCorrelation)
        .qualitySignals(signals)
        .interpretation(interpretation)
        .alertLevel(signals.isEmpty() ? "NORMAL"
            : signals.stream().anyMatch(s -> s.severity() == "HIGH")
            ? "ALERT" : "WARNING")
        .build();
}
```

### 10.2.3 Customer Response Generation

```java
@Tool(name = "draft_complaint_response",
      description = "Generate a professional complaint response letter based on "
          + "investigation findings and regulatory requirements")
public ComplaintResponse draftResponse(
        @Param("complaintId") String complaintId) {

    Complaint complaint = complaintService.getById(UUID.fromString(complaintId));

    // Get investigation results
    String investigation = complaint.getInvestigationSummary();
    String rootCause = complaint.getRootCause();
    String conclusion = complaint.getConclusion();

    // RAG retrieval for response templates
    String template = ragService.getTemplate("COMPLAINT_RESPONSE_" +
        complaint.getSource().name());

    // Generate response using LLM
    return llmService.generateComplaintResponse(
        template, complaint, investigation, rootCause, conclusion);
}
```

### 10.2.4 Recall Assessment

```java
@Tool(name = "assess_recall_risk",
      description = "Evaluate whether a product recall is warranted based on "
          + "complaint severity, batch impact, and regulatory requirements")
public RecallAssessment assessRecallNeed(
        @Param("complaintId") String complaintId) {

    Complaint complaint = complaintService.getById(UUID.fromString(complaintId));

    // Batch distribution analysis
    List<Batch> affectedBatches = batchService
        .findByProductAndDateRange(complaint.getProductCode(),
            complaint.getBatchNumber());
    BatchDistribution distribution = batchService
        .getDistributionInfo(affectedBatches);

    // Similar complaint count for same batch/product
    long similarCount = complaintRepository
        .countByProductCodeAndBatchNumber(
            complaint.getProductCode(),
            complaint.getBatchNumber());

    // FDA recall classification guidance
    RecallClassification recallClass = llmService.classifyRecall(
        complaint, distribution, similarCount,
        ragService.retrieveRelevantDocuments("FDA recall classification guidance"));

    return RecallAssessment.builder()
        .recallRecommended(recallClass.isRecallRecommended())
        .recallClass(recallClass.getClassification()) // Class I, II, III
        .affectedBatchCount(affectedBatches.size())
        .distributionScope(distribution.getScope())
        .patientRisk(recallClass.getPatientRisk())
        .regulatoryBasis(recallClass.getRegulatoryBasis())
        .recommendedActions(recallClass.getRecommendedActions())
        .confidence(recallClass.getConfidence())
        .reasoning(recallClass.getReasoning())
        .build();
}
```

## 10.3 Complaint Agent Workflow Integration

```
Existing BPMN Workflow            AI Agent Touchpoints
========================          =========================
Complaint Received          -----> [AI] Auto-triage: severity, type, AE detection
                                   [AI] Pattern analysis against historical complaints
                                   [AI] Immediate regulatory flag if adverse event
Initial Assessment          <----- [Human] Confirm severity and AE classification
[Adverse Event?]            -----> [AI] Calculate regulatory reporting deadline
                                   [AI] Pre-fill MedWatch/CDSCO form fields
File Regulatory Report      <----- [Human] Review and submit (within 15 days)
Root Cause Investigation    -----> [AI] Suggest root causes from product history
                                   [AI] Batch correlation analysis
                                   [AI] Draft investigation report
Disposition Review          -----> [AI] Recommend disposition based on findings
                           <----- [Human] E-sign disposition decision
[CAPA Required?]            -----> [AI] Recommend CAPA with pre-filled details
Create CAPA                 -----> [AI] Auto-link to complaint, pre-fill from findings
[Deviation Identified?]     -----> [AI] Identify if systemic deviation exists
Create Deviation            -----> [AI] Auto-create with complaint linkage
[Recall Required?]          -----> [AI] Full recall risk assessment
                                   [AI] Batch distribution analysis
                                   [AI] FDA classification guidance
Initiate Recall             <----- [Human] Approve recall decision (escalated)
Prepare & Send Response     -----> [AI] Draft customer response letter
                           <----- [Human] Review and send
QA Final Review & Closure   -----> [AI] Validate all required steps complete
                                   [AI] Generate closure summary
                           <----- [Human] E-sign closure
```

---

---

# Chapter 11: Audit AI Agent

## 11.1 Agent Purpose

The Audit AI Agent transforms audit management from reactive manual processes into intelligent, AI-assisted auditing. It handles audit planning optimization, checklist generation, evidence compilation, finding classification, and audit report drafting. It integrates with the `auditProcess` BPMN workflow.

## 11.2 Agent Capabilities

### 11.2.1 Intelligent Audit Planning

```java
@Tool(name = "generate_audit_plan",
      description = "Generate risk-based audit plan considering historical findings, "
          + "regulatory requirements, and process risk profiles")
public AuditPlanSuggestion generateAuditPlan(
        @Param("auditType") String auditType,
        @Param("plantSiteId") String plantSiteId,
        @Param("year") int year) {

    // Historical finding analysis by area
    Map<String, FindingSummary> areaRiskProfile = analyticsService
        .getFindingsByArea(plantSiteId, year - 3, year);

    // Open CAPAs and deviations by area
    Map<String, Long> openIssuesByArea = analyticsService
        .getOpenIssuesByArea(plantSiteId);

    // Previous audit coverage gaps
    List<String> uncoveredAreas = auditService
        .getUncoveredAreas(plantSiteId, year - 1);

    // Regulatory inspection history
    List<RegulatoryInspection> recentInspections = regulatoryService
        .getRecentInspections(plantSiteId, 3);

    // Risk-based prioritization via LLM
    return llmService.generateAuditPlan(
        auditType, areaRiskProfile, openIssuesByArea,
        uncoveredAreas, recentInspections, year);
}
```

### 11.2.2 Dynamic Checklist Generation

```java
@Tool(name = "generate_audit_checklist",
      description = "Generate audit checklist items based on audit scope, applicable "
          + "standards, historical findings, and current risk areas")
public AuditChecklist generateChecklist(
        @Param("auditId") String auditId) {

    Audit audit = auditService.getAuditById(UUID.fromString(auditId));

    // Applicable regulatory standards
    List<DocumentChunk> standards = ragService.retrieveRelevantDocuments(
        audit.getScope() + " " + audit.getStandardsReference(),
        "STANDARD", "GUIDELINE");

    // Previous findings for this area
    List<AuditFinding> previousFindings = auditFindingRepository
        .findByAreaAndPlantSite(audit.getAreaAudited(),
            audit.getPlantSite().getId());

    // Current open CAPAs for this area
    List<Capa> openCapas = capaRepository
        .findOpenByDepartment(audit.getAuditeeDepartment().getId());

    // Generate checklist with risk-weighted items
    return llmService.generateChecklist(
        audit, standards, previousFindings, openCapas);
}
```

### 11.2.3 Automated Evidence Compilation

```java
@Tool(name = "compile_audit_evidence",
      description = "Automatically gather supporting evidence for audit findings "
          + "from across QMS modules: SOPs, training records, calibration certificates, "
          + "batch records, deviation history")
public EvidencePackage compileEvidence(
        @Param("auditId") String auditId,
        @Param("findingId") String findingId) {

    AuditFinding finding = auditFindingRepository
        .findById(UUID.fromString(findingId)).orElseThrow();

    EvidencePackage.Builder evidence = EvidencePackage.builder();

    // 1. Relevant SOPs for the audited area
    List<Document> sops = documentService.findByAreaAndType(
        finding.getAreaAudited(), "SOP");
    evidence.applicableSOPs(sops);

    // 2. Training records for personnel in area
    List<TrainingAssignment> trainingRecords = trainingService
        .findByDepartmentAndStatus(finding.getDepartmentId(),
            TrainingStatus.COMPLETED);
    evidence.trainingRecords(trainingRecords);

    // 3. Equipment calibration status
    List<CalibrationRecord> calibrations = calibrationService
        .findByAreaAndDateRange(finding.getAreaAudited(),
            finding.getEvidencePeriodStart(),
            finding.getEvidencePeriodEnd());
    evidence.calibrationRecords(calibrations);

    // 4. Related deviations in period
    List<Deviation> deviations = deviationRepository
        .findByAreaAndDateRange(finding.getAreaAudited(),
            finding.getEvidencePeriodStart(),
            finding.getEvidencePeriodEnd());
    evidence.relatedDeviations(deviations);

    // 5. Batch records for audited products
    List<Batch> batches = batchService.findByAreaAndDateRange(
        finding.getAreaAudited(),
        finding.getEvidencePeriodStart(),
        finding.getEvidencePeriodEnd());
    evidence.batchRecords(batches);

    // 6. Environmental monitoring data (if applicable)
    evidence.environmentalData(environmentalService
        .getMonitoringData(finding.getAreaAudited(),
            finding.getEvidencePeriodStart(),
            finding.getEvidencePeriodEnd()));

    return evidence.build();
}
```

### 11.2.4 Finding Classification and CAPA Mapping

```java
@Tool(name = "classify_audit_finding",
      description = "Classify audit finding as Critical/Major/Minor/OFI and recommend "
          + "whether CAPA, deviation, or change control is required")
public FindingClassification classifyFinding(
        @Param("findingDescription") String description,
        @Param("auditArea") String area,
        @Param("standardReference") String standardRef) {

    // RAG retrieval for classification criteria
    List<DocumentChunk> criteria = ragService.retrieveRelevantDocuments(
        "audit finding classification criteria " + standardRef);

    // Historical finding patterns
    List<AuditFinding> similar = vectorSearchService
        .searchSimilarFindings(description, 10);

    FindingClassification result = llmService.classifyFinding(
        description, area, standardRef, criteria, similar);

    // Determine downstream actions
    result.setCapaRequired(
        result.getClassification() == FindingLevel.CRITICAL
        || result.getClassification() == FindingLevel.MAJOR);
    result.setDeviationRequired(
        result.isSystemicIssue());
    result.setChangeControlRequired(
        result.isProcessChangeNeeded());

    return result;
}
```

### 11.2.5 Audit Report Generation

```java
@Tool(name = "draft_audit_report",
      description = "Generate comprehensive audit report including executive summary, "
          + "findings, observations, evidence references, and recommendations")
public AuditReport draftAuditReport(
        @Param("auditId") String auditId) {

    Audit audit = auditService.getAuditById(UUID.fromString(auditId));
    List<AuditFinding> findings = auditService.listFindings(audit.getId());
    List<AuditChecklistItem> checklist = audit.getChecklistItems();

    // Calculate compliance metrics
    long totalItems = checklist.size();
    long conforming = checklist.stream()
        .filter(i -> i.getResponse() == ChecklistResponse.CONFORMING).count();
    double complianceRate = (double) conforming / totalItems * 100;

    // Generate report via LLM with GMP template
    String template = ragService.getTemplate("AUDIT_REPORT_" +
        audit.getAuditType().name());

    return llmService.generateAuditReport(template, audit, findings,
        checklist, complianceRate);
}
```

## 11.3 Audit Agent Workflow Integration

```
Existing BPMN Workflow           AI Agent Touchpoints
========================         =========================
Audit Planning              -----> [AI] Risk-based audit plan generation
                                   [AI] Optimal scheduling based on resource availability
Plan Approval              <----- [Human] Review and approve plan
Audit Execution             -----> [AI] Dynamic checklist generation
                                   [AI] Real-time evidence retrieval
                                   [AI] Finding classification suggestions
Findings Review             -----> [AI] Auto-classify Critical/Major/Minor/OFI
                                   [AI] Map findings to CAPA/Deviation/Change
[CAPA Required?]            -----> [AI] Auto-create CAPA with finding linkage
Create CAPA Records         -----> [AI] Pre-fill from finding details
[Deviation Required?]       -----> [AI] Create deviation (sourceType: AUDIT_FINDING)
[Change Required?]          -----> [AI] Draft change request
Auditee Response            -----> [AI] Suggest corrective action responses
Review Response             -----> [AI] Evaluate response adequacy
                           <----- [Human] Accept/request revision
Verify Findings             -----> [AI] Check CAPA closure status
Close Audit (E-Sig)         -----> [AI] Generate audit report
                                   [AI] Validate all findings addressed
                           <----- [Human] E-sign closure
```

---

# Chapter 12: Document AI Agent

## 12.1 Agent Purpose

The Document AI Agent manages the intelligent document lifecycle -- from AI-assisted SOP drafting through GxP terminology validation, revision comparison, cross-reference verification, and automated training assignment upon approval. It integrates with the `documentProcess` BPMN workflow.

## 12.2 Agent Capabilities

### 12.2.1 SOP Drafting from Templates

```java
@Tool(name = "draft_sop",
      description = "Generate SOP draft based on process description, existing "
          + "templates, and GxP documentation standards")
public SOPDraft draftSOP(
        @Param("processDescription") String description,
        @Param("documentType") String docType,
        @Param("department") String department) {

    // Retrieve SOP template
    String template = ragService.getTemplate("SOP_TEMPLATE_" + docType);

    // Find related existing SOPs for consistency
    List<DocumentChunk> relatedSOPs = ragService.retrieveRelevantDocuments(
        description, "SOP", "WORK_INSTRUCTION");

    // Regulatory requirements for this process type
    List<DocumentChunk> regulations = ragService.retrieveRelevantDocuments(
        description + " GMP regulatory requirements");

    // Generate SOP draft
    return llmService.generateSOPDraft(
        template, description, department, relatedSOPs, regulations);
}
```

### 12.2.2 Document Revision Comparison

```java
@Tool(name = "compare_document_versions",
      description = "Compare two document versions highlighting changes, assess GxP "
          + "impact of changes, and identify training implications")
public RevisionComparison compareVersions(
        @Param("documentId") String documentId,
        @Param("fromVersion") String fromVersion,
        @Param("toVersion") String toVersion) {

    DocumentVersion oldVersion = documentVersionService
        .findByDocumentAndVersion(UUID.fromString(documentId), fromVersion);
    DocumentVersion newVersion = documentVersionService
        .findByDocumentAndVersion(UUID.fromString(documentId), toVersion);

    // Content extraction and diff
    String oldContent = documentContentService.extractText(oldVersion);
    String newContent = documentContentService.extractText(newVersion);

    // AI-powered comparison
    return llmService.compareDocuments(oldContent, newContent,
        Map.of(
            "documentType", oldVersion.getDocument().getDocumentType().name(),
            "gmpRelevant", oldVersion.getDocument().isGmpRelevant(),
            "changeType", newVersion.getChangeType().name()
        ));
}
```

### 12.2.3 GxP Terminology Validation

```java
@Tool(name = "validate_gxp_terminology",
      description = "Validate document for GxP terminology compliance, detect "
          + "ambiguous language, missing references, and regulatory gaps")
public GxPValidationResult validateTerminology(
        @Param("documentId") String documentId) {

    Document document = documentService.getById(UUID.fromString(documentId));
    String content = documentContentService.extractText(
        document.getCurrentVersion());

    // GxP terminology database
    List<DocumentChunk> gxpGlossary = ragService.retrieveRelevantDocuments(
        "GxP terminology glossary pharmaceutical");

    // Check for ambiguous language
    List<TerminologyIssue> issues = llmService.validateGxPTerminology(
        content, gxpGlossary);

    // Check cross-references exist
    List<ReferenceIssue> refIssues = crossReferenceChecker
        .validateReferences(document);

    return GxPValidationResult.builder()
        .terminologyIssues(issues)
        .referenceIssues(refIssues)
        .overallCompliance(calculateCompliance(issues, refIssues))
        .recommendations(generateRecommendations(issues, refIssues))
        .build();
}
```

### 12.2.4 Training Impact Analysis

```java
@Tool(name = "identify_training_needs",
      description = "Identify personnel who need retraining based on document "
          + "revision scope and training matrix")
public TrainingImpact identifyTrainingNeeds(
        @Param("documentId") String documentId) {

    Document document = documentService.getById(UUID.fromString(documentId));

    // Training matrix lookup
    List<TrainingMatrix> matrixEntries = trainingMatrixRepository
        .findByCurriculumDocumentId(document.getId());

    // Personnel in affected roles/departments
    List<User> affectedPersonnel = matrixEntries.stream()
        .flatMap(tm -> userService.findByRoleAndDepartment(
            tm.getRole(), tm.getDepartment()).stream())
        .distinct()
        .collect(Collectors.toList());

    // Current training status for these personnel
    Map<UUID, TrainingAssignment> currentTraining = trainingService
        .getLatestAssignments(affectedPersonnel, document.getId());

    return TrainingImpact.builder()
        .totalAffectedPersonnel(affectedPersonnel.size())
        .personnelNeedingRetraining(affectedPersonnel.stream()
            .filter(u -> needsRetraining(u, currentTraining, document))
            .collect(Collectors.toList()))
        .trainingType(determineTrainingType(document))
        .estimatedCompletionDays(estimateCompletionTime(
            affectedPersonnel.size(), document.getDocumentType()))
        .build();
}
```

## 12.3 Document Agent Workflow Integration

```
Existing BPMN Workflow           AI Agent Touchpoints
========================         =========================
Document Drafted            -----> [AI] SOP drafting assistance
                                   [AI] GxP terminology validation
                                   [AI] Cross-reference verification
Document Draft Review       -----> [AI] Automated quality check
                                   [AI] Revision comparison (if revision)
                           <----- [Human] Review decision
QA Approval (E-Sig)         -----> [AI] Validate all review comments addressed
                           <----- [Human] E-sign approval
Training Assignment         -----> [AI] Identify affected personnel
                                   [AI] Auto-create training assignments
Make Document Effective     -----> [AI] Validate effective date
                                   [AI] Distribute to affected users
Periodic Review (P365D)     -----> [AI] Proactive review reminder
                                   [AI] Assess if revision needed based on
                                        recent changes, deviations, CAPAs
Author Revision (loop)      -----> [AI] Suggest revision content based on
                                        review comments
```

---

# Chapter 13: Training AI Agent

## 13.1 Agent Purpose

The Training AI Agent ensures organizational compliance by detecting training gaps, generating personalized learning paths, verifying competency, and predicting compliance risks before inspections. It integrates with the `trainingProcess` BPMN workflow.

## 13.2 Agent Capabilities

### 13.2.1 Training Gap Detection

```java
@Tool(name = "detect_training_gaps",
      description = "Analyze training matrix against current assignments to identify "
          + "personnel with missing, expired, or expiring training")
public TrainingGapReport detectGaps(
        @Param("plantSiteId") String plantSiteId,
        @Param("departmentId") String departmentId) {

    // Training matrix requirements
    List<TrainingMatrix> requirements = trainingMatrixRepository
        .findByPlantSiteAndDepartment(
            UUID.fromString(plantSiteId),
            departmentId != null ? UUID.fromString(departmentId) : null);

    // Current training assignments
    List<TrainingAssignment> assignments = trainingAssignmentRepository
        .findByPlantSiteActive(UUID.fromString(plantSiteId));

    // Detect gaps
    List<TrainingGap> gaps = new ArrayList<>();
    for (TrainingMatrix req : requirements) {
        List<User> requiredPersonnel = userService
            .findByRoleAndDepartment(req.getRole(), req.getDepartment());

        for (User person : requiredPersonnel) {
            TrainingAssignment latest = findLatestAssignment(
                assignments, person.getId(), req.getCurriculum().getId());

            if (latest == null) {
                gaps.add(new TrainingGap(person, req, GapType.NEVER_TRAINED));
            } else if (latest.getExpiryDate() != null
                    && latest.getExpiryDate().isBefore(LocalDate.now())) {
                gaps.add(new TrainingGap(person, req, GapType.EXPIRED));
            } else if (latest.getExpiryDate() != null
                    && latest.getExpiryDate().isBefore(
                        LocalDate.now().plusDays(30))) {
                gaps.add(new TrainingGap(person, req, GapType.EXPIRING_SOON));
            } else if (latest.getStatus() == TrainingStatus.OVERDUE) {
                gaps.add(new TrainingGap(person, req, GapType.OVERDUE));
            }
        }
    }

    return TrainingGapReport.builder()
        .totalGaps(gaps.size())
        .criticalGaps(gaps.stream()
            .filter(g -> g.getType() == GapType.NEVER_TRAINED
                || g.getType() == GapType.EXPIRED)
            .collect(Collectors.toList()))
        .warningGaps(gaps.stream()
            .filter(g -> g.getType() == GapType.EXPIRING_SOON
                || g.getType() == GapType.OVERDUE)
            .collect(Collectors.toList()))
        .complianceScore(calculateComplianceScore(requirements, gaps))
        .inspectionRisk(assessInspectionRisk(gaps))
        .build();
}
```

### 13.2.2 Personalized Learning Path

```java
@Tool(name = "generate_learning_path",
      description = "Create personalized training plan for an employee based on "
          + "their role, competency gaps, and upcoming requirements")
public LearningPath generateLearningPath(
        @Param("userId") String userId) {

    User user = userService.findById(UUID.fromString(userId));

    // Current competency profile
    List<TrainingAssignment> completedTraining = trainingService
        .getCompletedTraining(user.getId());

    // Required training from matrix
    List<TrainingMatrix> required = trainingMatrixRepository
        .findByRoleAndDepartment(user.getRoles(), user.getDepartment());

    // Upcoming requirements (new SOPs, role changes, CAPAs)
    List<TrainingAssignment> pendingAssignments = trainingService
        .getPendingAssignments(user.getId());

    // Priority ordering via LLM
    return llmService.generateLearningPath(
        user, completedTraining, required, pendingAssignments);
}
```

### 13.2.3 Training Effectiveness Assessment

```java
@Tool(name = "assess_training_effectiveness",
      description = "Evaluate training program effectiveness by correlating training "
          + "completion with deviation/error reduction in the trained area")
public TrainingEffectiveness assessEffectiveness(
        @Param("curriculumId") String curriculumId,
        @Param("months") int lookbackMonths) {

    TrainingCurriculum curriculum = curriculumService
        .getById(UUID.fromString(curriculumId));

    LocalDate startDate = LocalDate.now().minusMonths(lookbackMonths);

    // Training completion rates
    TrainingMetrics completionMetrics = analyticsService
        .getTrainingCompletionMetrics(curriculum.getId(), startDate);

    // Deviation rates before and after training
    DeviationTrend deviationTrend = analyticsService
        .getDeviationTrendByArea(curriculum.getRelatedArea(), startDate);

    // Error rates correlation
    return llmService.assessTrainingEffectiveness(
        curriculum, completionMetrics, deviationTrend);
}
```

## 13.3 Training Agent Workflow Integration

```
Existing BPMN Workflow           AI Agent Touchpoints
========================         =========================
Sources:
  Document Effective        -----> [AI] Identify affected personnel from matrix
  Change Control            -----> [AI] Determine retraining scope
  Deviation Closure         -----> [AI] Link training to root cause prevention
  CAPA Action               -----> [AI] Map preventive training to CAPA
  Manual Assignment         -----> [AI] Suggest appropriate curriculum

Training Assigned           -----> [AI] Personalized learning path
                                   [AI] Priority ordering
Complete Training           -----> [AI] Adaptive assessment questions
                                   [AI] Competency scoring
[PASSED/FAILED]             -----> [AI] Identify weak areas if failed
                                   [AI] Recommend remedial training
Verify Training             -----> [AI] Validate assessment integrity
                           <----- [Human] Confirm training verified
Update Source Record        -----> [AI] Auto-update source workflow
Retraining Reminder         -----> [AI] Proactive gap detection
                                   [AI] Predict compliance risk
```

---

# Chapter 14: Supplier AI Agent

## 14.1 Agent Purpose

The Supplier AI Agent manages intelligent supplier quality operations including risk prediction, qualification assessment, scorecard analysis, certificate monitoring, and SCAR management. It integrates with the `supplierProcess` BPMN workflow.

## 14.2 Agent Capabilities

### 14.2.1 Supplier Risk Prediction

```java
@Tool(name = "predict_supplier_risk",
      description = "Calculate supplier risk score based on quality history, "
          + "delivery performance, audit results, and NC trending")
public SupplierRiskScore predictRisk(
        @Param("supplierId") String supplierId) {

    Supplier supplier = supplierService.getById(UUID.fromString(supplierId));

    // Historical scorecards
    List<SupplierScorecard> scorecards = scorecardRepository
        .findBySupplierId(supplier.getId());

    // Nonconformances linked to supplier
    List<Nonconformance> ncs = ncRepository
        .findBySupplierIdOrderByDateDesc(supplier.getId());

    // Audit findings for supplier
    List<AuditFinding> auditFindings = auditFindingRepository
        .findBySupplierAudits(supplier.getId());

    // Complaint correlation with supplier materials
    List<Complaint> relatedComplaints = complaintRepository
        .findBySupplierMaterials(supplier.getId());

    // Certificate expiry tracking
    List<CertificateStatus> certStatuses = supplier.getCertifications()
        .stream().map(this::checkCertExpiry).collect(Collectors.toList());

    // ML-based risk prediction
    return predictiveModel.predictSupplierRisk(
        supplier, scorecards, ncs, auditFindings,
        relatedComplaints, certStatuses);
}
```

### 14.2.2 Qualification Assessment

```java
@Tool(name = "assess_supplier_qualification",
      description = "Evaluate supplier qualification documents (GMP, ISO, FDA certs, "
          + "quality agreements, COAs) and recommend qualification decision")
public QualificationAssessment assessQualification(
        @Param("supplierId") String supplierId,
        @Param("qualificationId") String qualificationId) {

    SupplierQualification qualification = qualificationRepository
        .findById(UUID.fromString(qualificationId)).orElseThrow();

    // Document analysis via OCR + LLM
    List<Attachment> documents = attachmentService
        .findByRecordTypeAndId("SUPPLIER", qualification.getId());

    List<DocumentAnalysis> analyses = documents.stream()
        .map(doc -> documentIntelligence.analyze(doc))
        .collect(Collectors.toList());

    // GMP compliance check
    GmpComplianceCheck gmpCheck = llmService.checkGmpCompliance(
        analyses, ragService.retrieveRelevantDocuments(
            "GMP qualification requirements for "
                + qualification.getSupplier().getSupplierType().name()));

    return QualificationAssessment.builder()
        .documentCompleteness(assessCompleteness(analyses))
        .gmpComplianceScore(gmpCheck.getScore())
        .missingDocuments(gmpCheck.getMissingDocuments())
        .concerns(gmpCheck.getConcerns())
        .recommendation(gmpCheck.getRecommendation())
        .auditRequired(gmpCheck.isAuditRecommended())
        .build();
}
```

### 14.2.3 Certificate Expiry Monitoring

```java
@Tool(name = "monitor_supplier_certificates",
      description = "Monitor all supplier certificates for expiry and generate "
          + "proactive renewal alerts")
public CertificateMonitoringReport monitorCertificates(
        @Param("plantSiteId") String plantSiteId) {

    List<Supplier> activeSuppliers = supplierRepository
        .findByPlantSiteAndStatusIn(UUID.fromString(plantSiteId),
            List.of(SupplierStatus.QUALIFIED, SupplierStatus.APPROVED,
                SupplierStatus.CONDITIONALLY_APPROVED));

    List<CertificateAlert> alerts = new ArrayList<>();
    for (Supplier supplier : activeSuppliers) {
        // Check GMP, ISO, FDA certificates
        checkCertificate(supplier, "GMP", supplier.getGmpCertExpiry(), alerts);
        checkCertificate(supplier, "ISO", supplier.getIsoCertExpiry(), alerts);
        checkCertificate(supplier, "FDA", supplier.getFdaRegExpiry(), alerts);
    }

    return CertificateMonitoringReport.builder()
        .totalSuppliers(activeSuppliers.size())
        .expired(alerts.stream()
            .filter(a -> a.getStatus() == CertStatus.EXPIRED).toList())
        .expiringIn30Days(alerts.stream()
            .filter(a -> a.getStatus() == CertStatus.EXPIRING_30).toList())
        .expiringIn90Days(alerts.stream()
            .filter(a -> a.getStatus() == CertStatus.EXPIRING_90).toList())
        .build();
}
```

---

# Chapter 15: Equipment & Calibration AI Agent

## 15.1 Agent Purpose

The Equipment AI Agent handles predictive maintenance scheduling, calibration failure impact analysis, qualification lifecycle management, and equipment-related deviation/CAPA automation. It integrates with the `equipmentProcess` BPMN workflow.

## 15.2 Agent Capabilities

### 15.2.1 Predictive Maintenance

```java
@Tool(name = "predict_maintenance_needs",
      description = "Analyze equipment history to predict upcoming maintenance needs "
          + "and optimal maintenance windows")
public MaintenancePrediction predictMaintenance(
        @Param("equipmentId") String equipmentId) {

    Equipment equipment = equipmentService.getById(UUID.fromString(equipmentId));

    // Maintenance history
    List<MaintenanceRecord> history = maintenanceRepository
        .findByEquipmentIdOrderByDateDesc(equipment.getId());

    // Calibration drift analysis
    List<CalibrationRecord> calibrations = calibrationRepository
        .findByEquipmentIdOrderByDateDesc(equipment.getId());

    // Deviation history for this equipment
    List<Deviation> deviations = deviationRepository
        .findByEquipmentInvolved(equipment.getName());

    // MTBF (Mean Time Between Failures) calculation
    double mtbf = calculateMTBF(history);

    // Predict next maintenance window
    return predictiveModel.predictMaintenance(
        equipment, history, calibrations, deviations, mtbf);
}
```

### 15.2.2 Calibration Failure Impact Analysis

```java
@Tool(name = "analyze_calibration_failure_impact",
      description = "When calibration fails, identify all batches produced since last "
          + "successful calibration and assess product quality impact")
public CalibrationFailureImpact analyzeCalibrationFailure(
        @Param("calibrationRecordId") String calibrationRecordId) {

    CalibrationRecord failedCal = calibrationRepository
        .findById(UUID.fromString(calibrationRecordId)).orElseThrow();
    Equipment equipment = failedCal.getEquipment();

    // Last successful calibration
    CalibrationRecord lastGood = calibrationRepository
        .findLastSuccessful(equipment.getId(), failedCal.getCalibrationDate());

    // Batches processed between last good cal and failed cal
    LocalDateTime impactStart = lastGood != null
        ? lastGood.getCalibrationDate() : equipment.getInstallationDate();
    List<Batch> affectedBatches = batchService
        .findByEquipmentAndDateRange(equipment.getName(),
            impactStart, failedCal.getCalibrationDate());

    // Out-of-tolerance assessment
    double tolerance = failedCal.getTolerance();
    double asFoundReading = failedCal.getAsFoundReading();
    double drift = Math.abs(asFoundReading - failedCal.getExpectedReading());

    // Product quality impact assessment
    return llmService.assessCalibrationImpact(
        failedCal, lastGood, affectedBatches, drift, tolerance);
}
```

---

# Chapter 16: Nonconformance AI Agent

## 16.1 Agent Purpose

The Nonconformance AI Agent handles rapid NC classification, material hold management, disposition recommendations, and cross-module linkage to supplier, deviation, CAPA, and risk modules. It integrates with the `nonconformanceProcess` BPMN workflow.

## 16.2 Agent Capabilities

### 16.2.1 NC Classification and Hold Assessment

```java
@Tool(name = "classify_nonconformance",
      description = "Classify nonconformance severity (Critical/Major/Minor) and "
          + "recommend whether immediate material hold is required")
public NCClassification classifyNC(
        @Param("nonconformanceId") String ncId) {

    Nonconformance nc = ncService.getById(UUID.fromString(ncId));

    // Historical NC patterns for same material/product
    List<Nonconformance> historicalNCs = vectorSearchService
        .searchSimilarNCs(nc.getDescription(), nc.getNcType().name(), 10);

    // Supplier history for this material
    SupplierRiskScore supplierRisk = null;
    if (nc.getSupplier() != null) {
        supplierRisk = supplierRiskService.getLatestScore(nc.getSupplier().getId());
    }

    return llmService.classifyNC(nc, historicalNCs, supplierRisk);
}
```

### 16.2.2 Disposition Recommendation

```java
@Tool(name = "recommend_disposition",
      description = "Recommend disposition decision (Use As-Is, Rework, Reprocess, "
          + "Return to Supplier, Scrap, Reject) based on NC investigation and impact")
public DispositionRecommendation recommendDisposition(
        @Param("nonconformanceId") String ncId) {

    Nonconformance nc = ncService.getById(UUID.fromString(ncId));

    // Cost analysis for each disposition option
    Map<String, CostEstimate> costAnalysis = Map.of(
        "USE_AS_IS", estimateCost(nc, DispositionDecision.USE_AS_IS),
        "REWORK", estimateCost(nc, DispositionDecision.REWORK),
        "REPROCESS", estimateCost(nc, DispositionDecision.REPROCESS),
        "RETURN_TO_SUPPLIER", estimateCost(nc, DispositionDecision.RETURN_TO_SUPPLIER),
        "SCRAP", estimateCost(nc, DispositionDecision.SCRAP));

    // Regulatory considerations
    List<DocumentChunk> regulations = ragService.retrieveRelevantDocuments(
        "disposition decision " + nc.getNcType().name() + " GMP requirements");

    // Historical disposition outcomes for similar NCs
    Map<String, Double> historicalOutcomes = analyticsService
        .getDispositionSuccessRates(nc.getNcType(), nc.getClassification());

    return llmService.recommendDisposition(
        nc, costAnalysis, regulations, historicalOutcomes);
}
```

---

# Chapter 17: Risk AI Agent

## 17.1 Agent Purpose

The Risk AI Agent provides intelligent risk evaluation, control effectiveness monitoring, RPN trending analysis, and proactive risk identification across all QMS modules. It integrates with the `riskProcess` BPMN workflow.

## 17.2 Agent Capabilities

### 17.2.1 Risk Scoring Assistance

```java
@Tool(name = "suggest_risk_scores",
      description = "Suggest severity, occurrence, and detectability scores for a "
          + "risk assessment based on historical data and industry benchmarks")
public RiskScoreSuggestion suggestScores(
        @Param("riskRegisterId") String riskId,
        @Param("riskDescription") String description) {

    // Historical risk assessments for similar risks
    List<RiskAssessment> similar = vectorSearchService
        .searchSimilarRisks(description, 15);

    // Industry benchmarks from RAG
    List<DocumentChunk> benchmarks = ragService.retrieveRelevantDocuments(
        description + " risk assessment pharmaceutical FMEA benchmarks");

    // Related deviations and complaints (occurrence data)
    long occurrenceCount = deviationRepository
        .countByDescriptionSimilar(description, 24); // 24 months

    // Detection capability from current controls
    List<RiskControl> existingControls = riskControlRepository
        .findByRiskRegisterId(UUID.fromString(riskId));

    return llmService.suggestRiskScores(
        description, similar, benchmarks, occurrenceCount, existingControls);
}
```

### 17.2.2 Risk Trend Analysis

```java
@Tool(name = "analyze_risk_trends",
      description = "Analyze RPN trends across risk registers and identify emerging "
          + "risk areas that require attention")
public RiskTrendAnalysis analyzeRiskTrends(
        @Param("plantSiteId") String plantSiteId,
        @Param("months") int lookbackMonths) {

    List<RiskRegister> registers = riskRegisterRepository
        .findByPlantSite(UUID.fromString(plantSiteId));

    // RPN trending by risk type
    Map<String, List<RPNTrendPoint>> rpnTrends = analyticsService
        .getRPNTrends(registers, lookbackMonths);

    // Emerging risks from deviation/complaint/NC trending
    List<EmergingRisk> emergingRisks = predictiveModel
        .identifyEmergingRisks(UUID.fromString(plantSiteId), lookbackMonths);

    // Control effectiveness degradation
    List<ControlDegradation> degradations = analyticsService
        .getControlEffectivenessTrend(registers, lookbackMonths);

    return llmService.analyzeRiskTrends(rpnTrends, emergingRisks, degradations);
}
```

---

# Chapter 18: Change Control AI Agent

## 18.1 Agent Purpose

The Change Control AI Agent assists with impact assessment automation, regulatory filing determination, implementation tracking, and downstream effect identification. It integrates with the `changeControlProcess` BPMN workflow.

## 18.2 Agent Capabilities

### 18.2.1 Impact Assessment Automation

```java
@Tool(name = "auto_impact_assessment",
      description = "Pre-populate the 8-dimension impact assessment matrix based on "
          + "change description, type, and affected areas")
public ImpactAssessmentSuggestion assessImpact(
        @Param("changeRequestId") String changeId) {

    ChangeRequest change = changeRequestService.getById(UUID.fromString(changeId));

    // 8-dimension assessment
    Map<String, ImpactRating> dimensions = new LinkedHashMap<>();

    // 1. Product Quality Impact
    dimensions.put("product_quality", assessProductQualityImpact(change));
    // 2. Patient Safety Impact
    dimensions.put("patient_safety", assessPatientSafetyImpact(change));
    // 3. Regulatory Compliance Impact
    dimensions.put("regulatory_compliance", assessRegulatoryImpact(change));
    // 4. Validation Status Impact
    dimensions.put("validation_status", assessValidationImpact(change));
    // 5. Documentation Impact
    dimensions.put("documentation", assessDocumentationImpact(change));
    // 6. Training Impact
    dimensions.put("training", assessTrainingImpact(change));
    // 7. Supplier Qualification Impact
    dimensions.put("supplier_qualification", assessSupplierImpact(change));
    // 8. Stability Impact
    dimensions.put("stability", assessStabilityImpact(change));

    // Overall risk level calculation
    ImpactRating overallRisk = calculateOverallRisk(dimensions);

    // Regulatory filing determination
    RegulatoryFilingType filingType = determineFilingType(change, dimensions);

    // Affected documents identification
    List<Document> affectedDocs = documentService
        .findByProcess(change.getAffectedProcess());

    // Training requirements
    List<TrainingRequirement> trainingNeeds = identifyTrainingNeeds(
        change, affectedDocs);

    return ImpactAssessmentSuggestion.builder()
        .dimensions(dimensions)
        .overallRiskLevel(overallRisk)
        .suggestedClassification(deriveClassification(overallRisk))
        .regulatoryFilingRequired(filingType != RegulatoryFilingType.NONE)
        .suggestedFilingType(filingType)
        .affectedDocuments(affectedDocs)
        .trainingRequirements(trainingNeeds)
        .confidence(0.82)
        .build();
}
```

### 18.2.2 Regulatory Filing Determination

```java
@Tool(name = "determine_regulatory_filing",
      description = "Determine whether regulatory filing is required and suggest "
          + "filing type (CBE-30, CBE-0, PAS, Annual Report, Variation)")
public RegulatoryFilingRecommendation determineFilingNeed(
        @Param("changeRequestId") String changeId) {

    ChangeRequest change = changeRequestService.getById(UUID.fromString(changeId));
    ChangeImpactAssessment impact = change.getImpactAssessment();

    // RAG retrieval for regulatory filing guidance
    List<DocumentChunk> guidance = ragService.retrieveRelevantDocuments(
        "regulatory filing requirements " + change.getChangeType().name()
        + " " + change.getCategory().name() + " pharmaceutical");

    // Filing type determination via LLM
    return llmService.determineRegFiling(change, impact, guidance);
}
```

---

# Chapter 19: Regulatory Intelligence Agent

## 19.1 Agent Purpose

The Regulatory Intelligence Agent continuously monitors regulatory guideline changes from FDA, WHO, EU EMA, India CDSCO/Schedule M, and assesses their impact on the organization's QMS. It operates proactively, alerting quality teams to compliance gaps before they become audit findings.

## 19.2 Agent Capabilities

### 19.2.1 Guideline Monitoring

```java
@Tool(name = "monitor_regulatory_updates",
      description = "Scan for recent regulatory guideline updates from FDA, WHO, "
          + "EMA, CDSCO and assess relevance to the organization")
public RegulatoryUpdateReport monitorUpdates() {

    // Fetch latest guidance from configured sources
    List<RegulatoryUpdate> updates = regulatoryFeedService.getRecentUpdates(30);

    // Assess relevance to organization's products and processes
    List<RelevantUpdate> relevant = updates.stream()
        .map(update -> {
            double relevance = llmService.assessRelevance(
                update, organizationProfile);
            return new RelevantUpdate(update, relevance);
        })
        .filter(ru -> ru.getRelevance() > 0.5)
        .sorted(Comparator.comparingDouble(RelevantUpdate::getRelevance).reversed())
        .collect(Collectors.toList());

    // Impact analysis for highly relevant updates
    for (RelevantUpdate ru : relevant) {
        if (ru.getRelevance() > 0.8) {
            ru.setImpactAnalysis(llmService.analyzeRegulatoryImpact(
                ru.getUpdate(), organizationProfile,
                ragService.retrieveRelevantDocuments(
                    ru.getUpdate().getTitle())));
        }
    }

    return RegulatoryUpdateReport.builder()
        .totalUpdatesScanned(updates.size())
        .relevantUpdates(relevant)
        .criticalActions(relevant.stream()
            .filter(r -> r.getRelevance() > 0.9)
            .map(r -> r.getImpactAnalysis().getRequiredActions())
            .flatMap(List::stream)
            .collect(Collectors.toList()))
        .build();
}
```

### 19.2.2 Inspection Readiness Assessment

```java
@Tool(name = "assess_inspection_readiness",
      description = "Comprehensive assessment of organization's readiness for "
          + "regulatory inspection based on open items across all QMS modules")
public InspectionReadinessReport assessReadiness(
        @Param("plantSiteId") String plantSiteId,
        @Param("inspectionType") String inspectionType) {

    UUID siteId = UUID.fromString(plantSiteId);

    // Aggregate open items across all modules
    InspectionReadinessReport.Builder report = InspectionReadinessReport.builder();

    report.openDeviations(deviationRepository.countOpenBySite(siteId));
    report.overdueDeviations(deviationRepository.countOverdueBySite(siteId));
    report.openCAPAs(capaRepository.countOpenBySite(siteId));
    report.overdueCAPAs(capaRepository.countOverdueBySite(siteId));
    report.openComplaints(complaintRepository.countOpenBySite(siteId));
    report.pendingChanges(changeRequestRepository.countPendingBySite(siteId));
    report.overdueTraining(trainingRepository.countOverdueBySite(siteId));
    report.overdueCalibrations(calibrationRepository.countOverdueBySite(siteId));
    report.expiredSOPs(documentRepository.countExpiredBySite(siteId));
    report.openAuditFindings(auditFindingRepository.countOpenBySite(siteId));

    // Calculate readiness score
    double readinessScore = calculateReadinessScore(report);
    report.readinessScore(readinessScore);

    // AI recommendations for improvement
    report.recommendations(llmService.generateReadinessRecommendations(
        report, inspectionType));

    // Risk areas ranking
    report.riskAreas(identifyTopRiskAreas(report));

    return report.build();
}
```

---

# Chapter 20: Predictive Compliance Agent

## 20.1 Agent Purpose

The Predictive Compliance Agent uses historical data patterns across all QMS modules to forecast compliance risks, predict KPI trends, and provide early warning for potential quality events.

## 20.2 Agent Capabilities

### 20.2.1 Compliance Score Calculation

```java
@Tool(name = "calculate_compliance_score",
      description = "Calculate an overall GMP compliance score for a plant site "
          + "based on weighted metrics across all QMS modules")
public ComplianceScorecard calculateComplianceScore(
        @Param("plantSiteId") String plantSiteId) {

    UUID siteId = UUID.fromString(plantSiteId);

    ComplianceScorecard scorecard = new ComplianceScorecard();

    // Module-level scores (0-100)
    scorecard.setDeviationScore(calculateDeviationScore(siteId));
    scorecard.setCapaScore(calculateCapaScore(siteId));
    scorecard.setComplaintScore(calculateComplaintScore(siteId));
    scorecard.setAuditScore(calculateAuditScore(siteId));
    scorecard.setDocumentScore(calculateDocumentScore(siteId));
    scorecard.setTrainingScore(calculateTrainingScore(siteId));
    scorecard.setSupplierScore(calculateSupplierScore(siteId));
    scorecard.setEquipmentScore(calculateEquipmentScore(siteId));
    scorecard.setRiskScore(calculateRiskScore(siteId));
    scorecard.setChangeScore(calculateChangeScore(siteId));

    // Weighted overall score
    double overall = calculateWeightedOverall(scorecard);
    scorecard.setOverallScore(overall);

    // Trend vs previous periods
    scorecard.setTrendVsPreviousMonth(calculateTrend(siteId, 1));
    scorecard.setTrendVsPreviousQuarter(calculateTrend(siteId, 3));

    // AI interpretation
    scorecard.setInterpretation(llmService.interpretComplianceScore(scorecard));
    scorecard.setTopRisks(llmService.identifyTopComplianceRisks(scorecard));

    return scorecard;
}
```

### 20.2.2 Quality Event Prediction

```java
@Tool(name = "predict_quality_events",
      description = "Predict potential quality events in the next 30/60/90 days "
          + "based on trending data across all modules")
public QualityPrediction predictQualityEvents(
        @Param("plantSiteId") String plantSiteId,
        @Param("horizonDays") int days) {

    UUID siteId = UUID.fromString(plantSiteId);

    // Gather trending data
    DeviationTrend devTrend = analyticsService.getDeviationTrend(siteId, 12);
    ComplaintTrend compTrend = analyticsService.getComplaintTrend(siteId, 12);
    CalibrationTrend calTrend = analyticsService.getCalibrationTrend(siteId, 12);
    SupplierTrend suppTrend = analyticsService.getSupplierTrend(siteId, 12);

    // ML-based prediction
    List<PredictedEvent> predictions = predictiveModel.predictQualityEvents(
        devTrend, compTrend, calTrend, suppTrend, days);

    // AI explanation
    return QualityPrediction.builder()
        .predictions(predictions)
        .highRiskAreas(predictions.stream()
            .filter(p -> p.getProbability() > 0.7)
            .collect(Collectors.toList()))
        .preventiveRecommendations(
            llmService.generatePreventiveRecommendations(predictions))
        .build();
}
```

---

# Chapter 21: Root Cause Investigation Agent

## 21.1 Agent Purpose

The Root Cause Investigation Agent is a cross-cutting agent shared by Deviation, CAPA, Complaint, and Nonconformance modules. It provides deep root cause analysis using multiple methodologies (5-Why, Fishbone, Fault Tree), historical pattern correlation, and cross-module root cause tracking.

## 21.2 Agent Capabilities

### 21.2.1 Multi-Method RCA

```java
@Tool(name = "perform_root_cause_analysis",
      description = "Perform comprehensive root cause analysis using multiple "
          + "methodologies and correlate with historical patterns across all QMS modules")
public ComprehensiveRCA performRCA(
        @Param("recordType") String recordType,
        @Param("recordId") String recordId,
        @Param("description") String problemDescription) {

    // 1. Semantic search across all modules for similar issues
    CrossModuleSearch search = vectorSearchService.searchAllModules(
        problemDescription, 20);

    // 2. Five-Why Analysis
    FiveWhyResult fiveWhy = llmService.performFiveWhy(
        problemDescription, search.getHistoricalRCAs());

    // 3. Fishbone Analysis (6M)
    FishboneResult fishbone = llmService.performFishbone(
        problemDescription, search.getEquipmentHistory(),
        search.getPersonnelData(), search.getProcessData(),
        search.getMaterialData(), search.getEnvironmentalData());

    // 4. Fault Tree Analysis
    FaultTreeResult faultTree = llmService.performFaultTree(
        problemDescription, search.getRelatedFailures());

    // 5. Cross-module correlation
    List<CrossModuleCorrelation> correlations = correlationEngine
        .findCorrelations(problemDescription, search);

    // 6. Recurrence pattern detection
    RecurrencePattern recurrence = patternDetector
        .detectRecurrence(problemDescription, search.getHistoricalRCAs());

    return ComprehensiveRCA.builder()
        .fiveWhyAnalysis(fiveWhy)
        .fishboneAnalysis(fishbone)
        .faultTreeAnalysis(faultTree)
        .crossModuleCorrelations(correlations)
        .recurrencePattern(recurrence)
        .suggestedRootCause(synthesizeRootCause(fiveWhy, fishbone, faultTree))
        .confidence(calculateOverallConfidence(fiveWhy, fishbone, faultTree))
        .build();
}
```

---

# Chapter 22: AI Copilot

## 22.1 Agent Purpose

The AI Copilot provides a natural language interface for all QMS operations. Users can query data, get summaries, request analysis, and initiate actions through conversational interaction.

## 22.2 Chat Interface Architecture

```java
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiCopilotController {

    private final SupervisorAgentBuilder supervisorAgent;
    private final AgentSessionService sessionService;
    private final AiAuditTrailService aiAuditTrail;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserPrincipal user) {

        // Get or create session
        Session session = sessionService.getOrCreateSession(
            user.getId(), "copilot");

        // Log AI request
        UUID requestId = aiAuditTrail.logRequest(
            user.getId(), request.getMessage(), "copilot");

        // Execute through supervisor agent
        AgentResponse response = supervisorAgent.build()
            .execute(session, request.getMessage());

        // Log AI response
        aiAuditTrail.logResponse(requestId, response.getText(),
            response.getConfidence(), response.getModel(),
            response.getToolCalls());

        return ResponseEntity.ok(ChatResponse.builder()
            .message(response.getText())
            .confidence(response.getConfidence())
            .sources(response.getSources())
            .suggestedActions(response.getSuggestedActions())
            .requestId(requestId)
            .build());
    }
}
```

## 22.3 Example Copilot Interactions

```
USER: "Show me all open critical deviations in the manufacturing area"
COPILOT: Routes to Deviation Agent -> search_deviations tool
         Returns list with status, age, assigned investigator

USER: "What's the root cause trend for contamination deviations this year?"
COPILOT: Routes to Deviation Agent -> analyze trends
         Routes to Root Cause Agent -> correlate patterns
         Returns trend chart with AI interpretation

USER: "Draft a CAPA plan for deviation DEV-2026-042"
COPILOT: Routes to CAPA Agent -> generates action plan
         Returns structured CAPA plan with actions, assignments, timelines

USER: "Are we ready for an FDA inspection?"
COPILOT: Routes to Predictive Compliance Agent -> inspection readiness
         Returns compliance scorecard with risk areas and recommendations

USER: "What training gaps do we have in the quality control department?"
COPILOT: Routes to Training Agent -> detect gaps
         Returns gap report with affected personnel and remediation plan

USER: "Create a deviation for contamination found in mixing area line 3"
COPILOT: Routes to Deviation Agent -> create deviation
         Pre-fills form, asks for confirmation, creates record on confirmation
```

---

# Chapter 23: AI Workflow Orchestrator

## 23.1 Purpose

The AI Workflow Orchestrator manages the 10 cross-module automation chains, ensuring that when AI triggers a downstream action (e.g., creating a CAPA from a deviation), all intermediate steps are properly executed, logged, and linked.

## 23.2 Cross-Module Event Handler

```java
@Component
@RequiredArgsConstructor
public class CrossModuleEventHandler {

    private final AgentRegistry agentRegistry;
    private final WorkflowService workflowService;
    private final AiAuditTrailService aiAuditTrail;

    @EventListener
    public void handleDeviationClassified(DeviationClassifiedEvent event) {
        if (event.getClassification() == DeviationClassification.CRITICAL) {
            // Fan out to multiple agents
            CompletableFuture<ImpactAnalysis> impactFuture =
                CompletableFuture.supplyAsync(() ->
                    agentRegistry.get("deviation").invoke(
                        "analyze_deviation_impact", event.getDeviationId()));

            CompletableFuture<RiskUpdate> riskFuture =
                CompletableFuture.supplyAsync(() ->
                    agentRegistry.get("risk").invoke(
                        "update_risk_from_deviation", event.getDeviationId()));

            CompletableFuture<TrainingGapCheck> trainingFuture =
                CompletableFuture.supplyAsync(() ->
                    agentRegistry.get("training").invoke(
                        "check_operator_training", event.getDeviationId()));

            // Join results
            CompletableFuture.allOf(impactFuture, riskFuture, trainingFuture)
                .thenAccept(v -> {
                    ImpactAnalysis impact = impactFuture.join();
                    RiskUpdate risk = riskFuture.join();
                    TrainingGapCheck training = trainingFuture.join();

                    // Generate consolidated notification
                    notificationService.sendCriticalDeviationAlert(
                        event.getDeviationId(), impact, risk, training);

                    // Log cross-module orchestration
                    aiAuditTrail.logOrchestration(
                        "CRITICAL_DEVIATION_IMPACT",
                        event.getDeviationId(),
                        List.of("deviation", "risk", "training"));
                });
        }
    }

    @EventListener
    public void handleCapaRequiredFromDeviation(CapaRequiredEvent event) {
        // Deviation -> CAPA chain
        Deviation deviation = deviationService.getById(event.getDeviationId());

        CapaRecommendation recommendation = agentRegistry.get("capa").invoke(
            "generate_capa_from_deviation", deviation);

        // Create CAPA suggestion (not auto-created -- human must confirm)
        aiSuggestionService.createSuggestion(
            AiSuggestion.builder()
                .type("CREATE_CAPA")
                .sourceModule("DEVIATION")
                .sourceRecordId(deviation.getId())
                .suggestion(recommendation)
                .requiresHumanApproval(true)
                .assignedTo(deviation.getReviewerId())
                .build());
    }

    @EventListener
    public void handleDocumentApproved(DocumentApprovedEvent event) {
        // Document -> Training chain
        TrainingImpact impact = agentRegistry.get("training").invoke(
            "identify_training_needs", event.getDocumentId());

        if (impact.getTotalAffectedPersonnel() > 0) {
            // Create training assignment suggestions
            for (User person : impact.getPersonnelNeedingRetraining()) {
                aiSuggestionService.createSuggestion(
                    AiSuggestion.builder()
                        .type("CREATE_TRAINING_ASSIGNMENT")
                        .sourceModule("DOCUMENT")
                        .sourceRecordId(event.getDocumentId())
                        .targetUserId(person.getId())
                        .suggestion(Map.of(
                            "curriculum", impact.getTrainingType(),
                            "reason", "SOP_REVISION",
                            "documentNumber", event.getDocumentNumber()
                        ))
                        .requiresHumanApproval(true)
                        .build());
            }
        }
    }
}
```

---

# Chapter 24: MCP Server Integration

## 24.1 What is MCP?

Model Context Protocol (MCP) is an open standard for connecting AI models to external data sources and tools. In the QMS-Pharma context, MCP servers expose the QMS REST APIs as standardized tools that any AI agent can invoke.

## 24.2 QMS MCP Server Architecture

```java
@Configuration
public class QmsMcpServerConfig {

    @Bean
    public McpServer qmsMcpServer(
            DeviationMcpTools deviationTools,
            CapaMcpTools capaTools,
            ComplaintMcpTools complaintTools,
            AuditMcpTools auditTools,
            DocumentMcpTools documentTools,
            TrainingMcpTools trainingTools,
            WorkflowMcpTools workflowTools,
            SearchMcpTools searchTools,
            AnalyticsMcpTools analyticsTools) {

        return McpServer.builder()
            .name("qms-pharma-mcp")
            .version("1.0.0")
            .description("QMS-Pharma eQMS MCP Server providing access to "
                + "pharmaceutical quality management tools")
            .tools(List.of(
                // Deviation tools
                deviationTools.listDeviations(),
                deviationTools.getDeviation(),
                deviationTools.createDeviation(),
                deviationTools.classifyDeviation(),
                deviationTools.submitInvestigation(),

                // CAPA tools
                capaTools.listCapas(),
                capaTools.getCapa(),
                capaTools.createCapa(),
                capaTools.submitRca(),
                capaTools.addAction(),

                // Workflow tools
                workflowTools.getInbox(),
                workflowTools.completeTask(),
                workflowTools.getWorkflowHistory(),

                // Search tools
                searchTools.semanticSearch(),
                searchTools.fullTextSearch(),

                // Analytics tools
                analyticsTools.getKPIs(),
                analyticsTools.getTrends(),
                analyticsTools.getComplianceScore()
            ))
            .resources(List.of(
                McpResource.builder()
                    .uri("qms://deviations/{id}")
                    .name("Deviation Record")
                    .description("Access deviation details by ID")
                    .build(),
                McpResource.builder()
                    .uri("qms://capas/{id}")
                    .name("CAPA Record")
                    .description("Access CAPA details by ID")
                    .build()
                // ... more resources
            ))
            .build();
    }
}
```

## 24.3 MCP Tool Registration Pattern

```java
@Component
public class DeviationMcpTools {

    @Autowired
    private DeviationService deviationService;

    public McpTool listDeviations() {
        return McpTool.builder()
            .name("list_deviations")
            .description("List deviations with optional filters for status, "
                + "classification, category, department, and text search")
            .inputSchema(JsonSchema.object()
                .property("status", JsonSchema.string()
                    .description("Filter by status: REPORTED, CLASSIFIED, etc."))
                .property("classification", JsonSchema.string()
                    .description("Filter by classification: CRITICAL, MAJOR, MINOR"))
                .property("search", JsonSchema.string()
                    .description("Full-text search across deviation fields"))
                .property("limit", JsonSchema.integer()
                    .description("Max results to return (default 20)"))
                .build())
            .handler(params -> {
                // Map MCP params to service call
                Page<DeviationResponse> results = deviationService.list(
                    params.optStringList("status"),
                    params.optStringList("classification"),
                    null, null, null, null,
                    params.optString("search"),
                    PageRequest.of(0, params.optInt("limit", 20)));
                return McpToolResult.success(results);
            })
            .build();
    }
}
```

---

# Chapter 25: Tool Design & Tool Registry

## 25.1 Tool Categories

Tools are organized into functional categories:

### 25.1.1 CRUD Tools (Data Access)
```
list_{module}s       - List records with filters
get_{module}         - Get single record by ID
create_{module}      - Create new record
update_{module}      - Update existing record
```

### 25.1.2 Workflow Tools (Process Management)
```
get_inbox            - Get user's pending tasks
complete_task        - Complete a workflow task
get_workflow_history - Get workflow step history
start_workflow       - Start a new workflow process
claim_task           - Claim a candidate group task
```

### 25.1.3 Analysis Tools (AI Intelligence)
```
classify_{module}           - AI classification with confidence
suggest_root_causes         - Historical pattern matching
analyze_impact              - Cross-module impact analysis
predict_{metric}            - Predictive analytics
search_similar              - Vector similarity search
analyze_trends              - Time-series analysis
```

### 25.1.4 Generation Tools (Content Creation)
```
draft_report                - Generate investigation/audit reports
draft_sop                   - Generate SOP documents
draft_response              - Generate complaint responses
generate_action_plan        - Generate CAPA action plans
generate_checklist          - Generate audit checklists
```

### 25.1.5 Compliance Tools (Regulatory)
```
assess_inspection_readiness - Readiness scoring
check_compliance_gaps       - Gap identification
monitor_regulatory_updates  - Guideline monitoring
determine_filing_type       - Regulatory filing assessment
```

### 25.1.6 Human Approval Tools
```
request_approval            - Queue for human review
check_approval_status       - Check if human has responded
submit_electronic_signature - Trigger e-signature flow
```

## 25.2 Tool Registry Implementation

```java
@Service
public class ToolRegistry {

    private final Map<String, AgentTool> tools = new ConcurrentHashMap<>();
    private final AiAuditTrailService auditTrail;

    public void register(String name, AgentTool tool) {
        // Wrap every tool with audit logging
        AgentTool audited = new AuditedToolWrapper(tool, auditTrail);
        tools.put(name, audited);
    }

    public AgentTool get(String name) {
        AgentTool tool = tools.get(name);
        if (tool == null) {
            throw new ToolNotFoundException("Tool not found: " + name);
        }
        return tool;
    }

    public List<ToolDescriptor> listTools() {
        return tools.entrySet().stream()
            .map(e -> new ToolDescriptor(e.getKey(),
                e.getValue().getDescription(),
                e.getValue().getInputSchema()))
            .collect(Collectors.toList());
    }

    /**
     * Wrapper that logs every tool invocation to the AI audit trail
     */
    private static class AuditedToolWrapper implements AgentTool {
        private final AgentTool delegate;
        private final AiAuditTrailService auditTrail;

        @Override
        public Object execute(Map<String, Object> params) {
            UUID traceId = UUID.randomUUID();
            long startTime = System.currentTimeMillis();

            try {
                Object result = delegate.execute(params);

                auditTrail.logToolExecution(
                    traceId, delegate.getName(), params,
                    result, System.currentTimeMillis() - startTime,
                    "SUCCESS");

                return result;
            } catch (Exception e) {
                auditTrail.logToolExecution(
                    traceId, delegate.getName(), params,
                    e.getMessage(), System.currentTimeMillis() - startTime,
                    "FAILURE");
                throw e;
            }
        }
    }
}
```

---

# Chapter 26: Memory Architecture

## 26.1 Agent Memory Types

The AI agents use three types of memory for context persistence:

### 26.1.1 Short-Term Memory (Session Context)
- Stored in Redis with TTL
- Contains current conversation context, user preferences, active records
- Scoped to user + agent session

### 26.1.2 Long-Term Memory (Knowledge Base)
- Stored in PostgreSQL + pgvector
- Contains learned patterns, validated classifications, historical outcomes
- Scoped to organization

### 26.1.3 Episodic Memory (Interaction History)
- Stored in PostgreSQL
- Contains past AI interactions, tool calls, and their outcomes
- Used for improving future recommendations

## 26.2 Memory Schema

```sql
-- AI Agent Memory Tables
CREATE TABLE ai_agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    agent_name VARCHAR(100) NOT NULL,
    session_data JSONB NOT NULL DEFAULT '{}',
    context JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE ai_agent_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL,
    memory_type VARCHAR(50) NOT NULL, -- SHORT_TERM, LONG_TERM, EPISODIC
    key VARCHAR(500) NOT NULL,
    value JSONB NOT NULL,
    embedding vector(768), -- pgvector for semantic retrieval
    relevance_score DOUBLE PRECISION DEFAULT 1.0,
    access_count INTEGER DEFAULT 0,
    organization_id UUID REFERENCES organizations(id),
    plant_site_id UUID REFERENCES plant_sites(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_memories_agent_type ON ai_agent_memories(agent_name, memory_type);
CREATE INDEX idx_memories_embedding ON ai_agent_memories
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## 26.3 Memory Service Implementation

```java
@Service
@RequiredArgsConstructor
public class AgentMemoryService {

    private final AgentMemoryRepository memoryRepository;
    private final EmbeddingService embeddingService;

    /**
     * Store a learned pattern (e.g., "contamination in mixing area is usually MAJOR")
     */
    public void remember(String agentName, String key, Object value,
                         MemoryType type) {
        float[] embedding = embeddingService.embed(key);

        AgentMemory memory = AgentMemory.builder()
            .agentName(agentName)
            .memoryType(type)
            .key(key)
            .value(objectMapper.valueToTree(value))
            .embedding(embedding)
            .build();

        memoryRepository.save(memory);
    }

    /**
     * Retrieve relevant memories using semantic search
     */
    public List<AgentMemory> recall(String agentName, String query, int limit) {
        float[] queryEmbedding = embeddingService.embed(query);

        return memoryRepository.findSimilar(
            agentName, queryEmbedding, limit);
    }

    /**
     * Update memory relevance based on outcome feedback
     */
    public void updateRelevance(UUID memoryId, boolean wasHelpful) {
        AgentMemory memory = memoryRepository.findById(memoryId).orElseThrow();
        double adjustment = wasHelpful ? 0.1 : -0.1;
        memory.setRelevanceScore(
            Math.max(0, Math.min(1, memory.getRelevanceScore() + adjustment)));
        memory.setAccessCount(memory.getAccessCount() + 1);
        memoryRepository.save(memory);
    }
}
```

---

# Chapter 27: RAG Architecture

## 27.1 RAG Pipeline Overview

Retrieval-Augmented Generation (RAG) enables agents to access validated pharmaceutical knowledge, SOPs, regulatory guidelines, and historical investigation data.

```
Query: "What are the GMP requirements for deviation investigation?"

Step 1: EMBED query using text-embedding-005
Step 2: SEARCH pgvector for similar document chunks
Step 3: RETRIEVE top-k relevant chunks (SOPs, guidelines, templates)
Step 4: AUGMENT LLM prompt with retrieved context
Step 5: GENERATE response grounded in validated knowledge
Step 6: CITE sources with document numbers and section references
```

## 27.2 Document Ingestion Pipeline

```java
@Service
@RequiredArgsConstructor
public class RagIngestionService {

    private final DocumentContentService contentService;
    private final EmbeddingService embeddingService;
    private final VectorStoreRepository vectorStore;

    /**
     * Ingest a QMS document into the RAG knowledge base
     */
    public void ingestDocument(Document document) {
        // 1. Extract text content
        String content = contentService.extractText(document.getCurrentVersion());

        // 2. Chunk text with overlap
        List<TextChunk> chunks = textChunker.chunk(content,
            ChunkConfig.builder()
                .chunkSize(512)       // tokens per chunk
                .overlap(64)          // overlap tokens
                .respectBoundaries(true) // don't break mid-section
                .build());

        // 3. Generate embeddings for each chunk
        for (TextChunk chunk : chunks) {
            float[] embedding = embeddingService.embed(chunk.getText());

            DocumentEmbedding docEmb = DocumentEmbedding.builder()
                .documentId(document.getId())
                .documentNumber(document.getDocumentNumber())
                .documentType(document.getDocumentType().name())
                .version(document.getCurrentVersion().getVersionNumber())
                .chunkIndex(chunk.getIndex())
                .chunkText(chunk.getText())
                .sectionTitle(chunk.getSectionTitle())
                .embedding(embedding)
                .metadata(Map.of(
                    "department", document.getDepartment().getName(),
                    "effectiveDate", document.getEffectiveDate().toString(),
                    "reviewStatus", document.getStatus().name()
                ))
                .build();

            vectorStore.save(docEmb);
        }
    }

    /**
     * Re-ingest when document is revised
     */
    @EventListener
    public void onDocumentRevised(DocumentRevisedEvent event) {
        // Remove old embeddings
        vectorStore.deleteByDocumentId(event.getDocumentId());
        // Re-ingest new version
        ingestDocument(documentService.getById(event.getDocumentId()));
    }
}
```

## 27.3 RAG Retrieval Service

```java
@Service
@RequiredArgsConstructor
public class RagRetrievalService {

    private final VectorStoreRepository vectorStore;
    private final EmbeddingService embeddingService;

    /**
     * Retrieve relevant document chunks for a query
     */
    public List<DocumentChunk> retrieveRelevantDocuments(
            String query, String... documentTypes) {

        float[] queryEmbedding = embeddingService.embed(query);

        return vectorStore.searchSimilar(
            queryEmbedding,
            documentTypes.length > 0 ? List.of(documentTypes) : null,
            10,     // top-k results
            0.7     // minimum similarity threshold
        );
    }

    /**
     * Retrieve template for report/document generation
     */
    public String getTemplate(String templateName) {
        return vectorStore.getTemplateByName(templateName);
    }
}
```

## 27.4 Knowledge Base Categories

| Category | Sources | Update Frequency |
|----------|---------|-----------------|
| SOPs & Work Instructions | QMS Document module | On document approval |
| Regulatory Guidelines | FDA, WHO, EU, CDSCO feeds | Weekly scan |
| Investigation Reports | Deviation, CAPA, Complaint closures | On record closure |
| Audit Reports | Audit module | On audit closure |
| GxP Terminology | Validated glossary | Quarterly review |
| Templates | Report, SOP, response templates | On template update |
| Training Materials | Training curriculum content | On curriculum update |
| Risk Assessments | Risk register data | On risk review |

---

# Chapter 28: Knowledge Graph Architecture

## 28.1 Purpose

The Knowledge Graph captures relationships between QMS entities that are difficult to query through relational SQL alone. It enables the Root Cause Investigation Agent and Predictive Compliance Agent to find non-obvious correlations.

## 28.2 Graph Schema

```
Nodes:
  (:Deviation {id, number, classification, category, rootCause, status})
  (:CAPA {id, number, type, priority, rootCause, status})
  (:Complaint {id, number, type, classification, status})
  (:AuditFinding {id, classification, area, status})
  (:Equipment {id, name, type, category, calibrationStatus})
  (:Product {id, code, name, dosageForm})
  (:Batch {id, number, status})
  (:Supplier {id, name, category, qualificationStatus})
  (:Document {id, number, type, status})
  (:User {id, name, role, department})
  (:RiskRegister {id, type, riskLevel, rpn})
  (:Area {name, type})
  (:RootCause {description, category})

Relationships:
  (:Deviation)-[:CAUSED_BY]->(:RootCause)
  (:Deviation)-[:TRIGGERED]->(:CAPA)
  (:Deviation)-[:AFFECTED]->(:Batch)
  (:Deviation)-[:INVOLVED]->(:Equipment)
  (:Deviation)-[:OCCURRED_IN]->(:Area)
  (:Deviation)-[:REPORTED_BY]->(:User)
  (:Deviation)-[:SOURCED_FROM]->(:Complaint)

  (:CAPA)-[:ADDRESSES]->(:RootCause)
  (:CAPA)-[:ORIGINATED_FROM]->(:Deviation)
  (:CAPA)-[:ORIGINATED_FROM]->(:AuditFinding)
  (:CAPA)-[:ORIGINATED_FROM]->(:Complaint)

  (:Complaint)-[:ABOUT]->(:Product)
  (:Complaint)-[:ABOUT]->(:Batch)
  (:Complaint)-[:TRIGGERED]->(:Deviation)

  (:AuditFinding)-[:FOUND_IN]->(:Area)
  (:AuditFinding)-[:TRIGGERED]->(:CAPA)

  (:Equipment)-[:USED_FOR]->(:Product)
  (:Equipment)-[:LOCATED_IN]->(:Area)
  (:Equipment)-[:SUPPLIED_BY]->(:Supplier)

  (:Batch)-[:PRODUCED_WITH]->(:Equipment)
  (:Batch)-[:USES_MATERIAL_FROM]->(:Supplier)

  (:Supplier)-[:SUPPLIES]->(:Product)
  (:Supplier)-[:HAD_NC]->(:Nonconformance)

  (:RootCause)-[:SIMILAR_TO]->(:RootCause)
  (:RootCause)-[:RECURS_IN]->(:Area)
```

## 28.3 Graph Queries for AI Agents

```cypher
// Find all root causes that recur in a specific area
MATCH (rc:RootCause)<-[:CAUSED_BY]-(d:Deviation)-[:OCCURRED_IN]->(a:Area {name: $area})
WITH rc, COUNT(d) as occurrences
WHERE occurrences > 1
RETURN rc.description, occurrences
ORDER BY occurrences DESC

// Trace complaint to root cause through all intermediate records
MATCH path = (c:Complaint)-[:TRIGGERED*..3]->(capa:CAPA)-[:ADDRESSES]->(rc:RootCause)
WHERE c.id = $complaintId
RETURN path

// Find equipment connected to multiple deviations
MATCH (e:Equipment)<-[:INVOLVED]-(d:Deviation)
WITH e, COUNT(d) as deviationCount, COLLECT(d.classification) as classifications
WHERE deviationCount > 2
RETURN e.name, deviationCount, classifications

// Supplier risk chain: Supplier -> NC -> Deviation -> CAPA
MATCH (s:Supplier)-[:HAD_NC]->(nc:Nonconformance),
      (nc)-[:TRIGGERED]->(d:Deviation),
      (d)-[:TRIGGERED]->(capa:CAPA)
WHERE s.id = $supplierId
RETURN s.name, COUNT(DISTINCT nc) as ncCount,
       COUNT(DISTINCT d) as devCount, COUNT(DISTINCT capa) as capaCount
```

## 28.4 Implementation with PostgreSQL (JSONB + Recursive CTEs)

For initial deployment, the knowledge graph can be implemented using PostgreSQL's JSONB and recursive CTEs, avoiding the need for a separate graph database:

```sql
CREATE TABLE knowledge_graph_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_type VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE knowledge_graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id),
    target_node_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id),
    relationship_type VARCHAR(50) NOT NULL,
    properties JSONB DEFAULT '{}',
    weight DOUBLE PRECISION DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kg_nodes_type ON knowledge_graph_nodes(node_type);
CREATE INDEX idx_kg_edges_source ON knowledge_graph_edges(source_node_id);
CREATE INDEX idx_kg_edges_target ON knowledge_graph_edges(target_node_id);
CREATE INDEX idx_kg_edges_rel ON knowledge_graph_edges(relationship_type);
```

---

# Chapter 29: Vector Database Design

## 29.1 pgvector Extension for PostgreSQL

Since the platform already uses PostgreSQL 17, pgvector provides vector similarity search without a separate database:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document embeddings for RAG
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    document_number VARCHAR(50) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    version VARCHAR(20),
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    section_title VARCHAR(500),
    embedding vector(768) NOT NULL, -- text-embedding-005 output dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deviation embeddings for similarity search
CREATE TABLE deviation_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviation_id UUID NOT NULL REFERENCES deviations(id),
    deviation_number VARCHAR(50) NOT NULL,
    classification VARCHAR(20),
    category VARCHAR(50),
    description_embedding vector(768) NOT NULL,
    investigation_embedding vector(768),
    root_cause_embedding vector(768),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CAPA embeddings
CREATE TABLE capa_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_id UUID NOT NULL REFERENCES capas(id),
    capa_number VARCHAR(50) NOT NULL,
    description_embedding vector(768) NOT NULL,
    root_cause_embedding vector(768),
    actions_embedding vector(768),
    effectiveness_result VARCHAR(30),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint embeddings
CREATE TABLE complaint_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id),
    complaint_number VARCHAR(50) NOT NULL,
    description_embedding vector(768) NOT NULL,
    investigation_embedding vector(768),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW indexes for fast approximate nearest neighbor search
CREATE INDEX idx_doc_embedding_hnsw ON document_embeddings
    USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_dev_embedding_hnsw ON deviation_embeddings
    USING hnsw (description_embedding vector_cosine_ops);
CREATE INDEX idx_capa_embedding_hnsw ON capa_embeddings
    USING hnsw (description_embedding vector_cosine_ops);
CREATE INDEX idx_complaint_embedding_hnsw ON complaint_embeddings
    USING hnsw (description_embedding vector_cosine_ops);
```

## 29.2 Vector Search Queries

```sql
-- Find similar deviations by description
SELECT d.deviation_number, d.description, d.classification,
       1 - (de.description_embedding <=> $1::vector) as similarity
FROM deviation_embeddings de
JOIN deviations d ON d.id = de.deviation_id
WHERE d.status = 'CLOSED'
  AND 1 - (de.description_embedding <=> $1::vector) > 0.7
ORDER BY de.description_embedding <=> $1::vector
LIMIT 10;

-- Find relevant SOPs for a deviation investigation
SELECT doc.document_number, doc.title, de.section_title, de.chunk_text,
       1 - (de.embedding <=> $1::vector) as similarity
FROM document_embeddings de
JOIN documents doc ON doc.id = de.document_id
WHERE doc.document_type IN ('SOP', 'WORK_INSTRUCTION')
  AND doc.status = 'EFFECTIVE'
ORDER BY de.embedding <=> $1::vector
LIMIT 5;
```

---

# Chapter 30: Document Intelligence & OCR

## 30.1 Document Processing Pipeline

```java
@Service
@RequiredArgsConstructor
public class DocumentIntelligenceService {

    private final DocumentAiClient documentAiClient; // Google Document AI

    /**
     * Process uploaded documents (COAs, certificates, batch records)
     * using Google Document AI for OCR and structured extraction
     */
    public DocumentAnalysis processDocument(Attachment attachment) {
        // 1. Download from GCS
        byte[] content = gcsService.download(attachment.getFilePath());

        // 2. OCR via Google Document AI
        OcrResult ocr = documentAiClient.processDocument(content,
            attachment.getContentType());

        // 3. Structured field extraction
        Map<String, String> extractedFields = documentAiClient
            .extractFields(content, getProcessorId(attachment.getCategory()));

        // 4. Quality validation
        List<ValidationIssue> issues = validateExtractedData(
            extractedFields, attachment.getCategory());

        // 5. Generate embedding for RAG
        float[] embedding = embeddingService.embed(ocr.getText());

        return DocumentAnalysis.builder()
            .rawText(ocr.getText())
            .extractedFields(extractedFields)
            .validationIssues(issues)
            .embedding(embedding)
            .confidence(ocr.getConfidence())
            .build();
    }

    /**
     * Processor IDs for different document types
     */
    private String getProcessorId(AttachmentCategory category) {
        return switch (category) {
            case REGULATORY -> "coa-processor";        // Certificate of Analysis
            case VALIDATION -> "validation-processor";  // Validation protocols
            case TRAINING -> "certificate-processor";   // Training certificates
            case EVIDENCE -> "general-processor";       // General documents
            default -> "general-processor";
        };
    }
}
```

## 30.2 Document Types for AI Processing

| Document Type | OCR Processor | Extracted Fields | Use Case |
|--------------|---------------|-----------------|----------|
| Certificate of Analysis (COA) | Custom Form Processor | Test results, specifications, batch number, date | Supplier qualification, incoming QC |
| GMP Certificates | Document AI | Certificate number, issuing authority, expiry date | Supplier monitoring |
| Batch Records | Custom Form Processor | Batch number, product, quantities, process parameters | Deviation investigation |
| Calibration Certificates | Custom Form Processor | Equipment ID, cal date, next due, results | Equipment management |
| Training Certificates | Document AI | Trainee name, course, date, score | Training records |
| Regulatory Submissions | Document AI | Submission type, reference numbers, dates | Change control |

---

# Chapter 31: AI Prompt Engineering

## 31.1 Prompt Design Principles for GxP

1. **Deterministic Templates**: Use structured templates with explicit instructions, not creative prompts
2. **Constraint Injection**: Every prompt includes GxP constraints, safety flags, and confidence requirements
3. **Citation Required**: LLM must cite sources for every factual claim
4. **Confidence Gating**: Responses below confidence threshold are flagged for human review
5. **Versioned Prompts**: All prompts are version-controlled, validated, and tracked in audit trail

## 31.2 Prompt Template Architecture

```java
@Component
public class PromptTemplateService {

    private final Map<String, PromptTemplate> templates = new ConcurrentHashMap<>();

    @PostConstruct
    public void loadTemplates() {
        // Deviation classification prompt
        templates.put("DEVIATION_CLASSIFY", PromptTemplate.builder()
            .name("DEVIATION_CLASSIFY")
            .version("1.3")
            .validatedDate(LocalDate.of(2026, 3, 15))
            .validatedBy("QA-Manager")
            .template("""
                SYSTEM: You are a pharmaceutical GMP deviation classification expert.
                You MUST classify deviations according to the provided GMP criteria.
                You MUST provide a confidence score between 0.0 and 1.0.
                You MUST cite specific GMP criteria that support your classification.
                You MUST flag any patient safety concerns.
                You MUST NOT make up information not present in the provided context.

                GMP CLASSIFICATION CRITERIA:
                {{gmpCriteria}}

                DEVIATION DETAILS:
                {{deviationContext}}

                HISTORICAL SIMILAR DEVIATIONS:
                {{historicalContext}}

                RESPONSE FORMAT (JSON):
                {
                  "classification": "CRITICAL|MAJOR|MINOR",
                  "confidence": 0.0-1.0,
                  "reasoning": "Step-by-step reasoning...",
                  "applicableCriteria": ["criteria1", "criteria2"],
                  "patientSafetyFlag": true|false,
                  "patientSafetyReasoning": "...",
                  "similarCaseEvidence": ["DEV-XXXX: outcome"],
                  "capaRecommended": true|false,
                  "immediateActions": ["action1", "action2"]
                }
                """)
            .build());

        // CAPA action plan prompt
        templates.put("CAPA_ACTION_PLAN", PromptTemplate.builder()
            .name("CAPA_ACTION_PLAN")
            .version("1.1")
            .template("""
                SYSTEM: You are a pharmaceutical CAPA action planning expert.
                Generate corrective and preventive actions based on the root cause.

                ROOT CAUSE ANALYSIS:
                {{rcaContext}}

                RISK ASSESSMENT:
                {{riskContext}}

                HISTORICAL EFFECTIVE ACTIONS:
                {{historicalActions}}

                REQUIREMENTS:
                - Each action must be SMART (Specific, Measurable, Achievable,
                  Relevant, Time-bound)
                - Include both CORRECTIVE (address the specific instance) and
                  PREVENTIVE (prevent recurrence) actions
                - Suggest responsible role for each action
                - Estimate completion timeframe
                - Define verification criteria
                - Reference applicable SOPs

                RESPONSE FORMAT (JSON):
                {
                  "correctiveActions": [...],
                  "preventiveActions": [...],
                  "estimatedEffectiveness": 0.0-1.0,
                  "riskMitigation": "..."
                }
                """)
            .build());
    }
}
```

## 31.3 Prompt Validation Framework

```java
@Service
public class PromptValidationService {

    /**
     * Validate that prompt output meets GxP requirements
     */
    public ValidationResult validateOutput(
            String promptName, String rawOutput, Object parsedOutput) {

        List<ValidationIssue> issues = new ArrayList<>();

        // 1. Check confidence threshold
        if (parsedOutput instanceof HasConfidence hc) {
            if (hc.getConfidence() < 0.5) {
                issues.add(new ValidationIssue("LOW_CONFIDENCE",
                    "AI confidence below minimum threshold (0.5)"));
            }
        }

        // 2. Check for hallucination indicators
        if (containsHallucinationIndicators(rawOutput)) {
            issues.add(new ValidationIssue("POTENTIAL_HALLUCINATION",
                "Output contains phrases indicating uncertainty"));
        }

        // 3. Check for patient safety flags
        if (rawOutput.toLowerCase().contains("patient safety")
            && !rawOutput.contains("patientSafetyFlag")) {
            issues.add(new ValidationIssue("SAFETY_FLAG_MISSING",
                "Patient safety mentioned but not properly flagged"));
        }

        // 4. Check citation presence
        if (promptRequiresCitations(promptName)
            && !containsCitations(rawOutput)) {
            issues.add(new ValidationIssue("MISSING_CITATIONS",
                "Response lacks required source citations"));
        }

        return new ValidationResult(issues.isEmpty(), issues);
    }
}
```

---

# Chapter 32: LLM Selection

## 32.1 Model Selection Strategy

| Use Case | Primary Model | Fallback Model | Reasoning |
|----------|--------------|----------------|-----------|
| Classification (Deviation, Complaint, NC) | Gemini 2.5 Pro | GPT-4o | High accuracy needed, structured output |
| Report Generation (Investigation, Audit) | Gemini 2.5 Pro | Claude Sonnet 4.6 | Long-form generation, regulatory language |
| Root Cause Analysis | Gemini 2.5 Pro | GPT-4o | Complex reasoning, pattern matching |
| Document Summarization | Gemini 2.5 Flash | Gemini 2.5 Pro | Speed, cost optimization |
| Translation/Terminology | Gemini 2.5 Flash | GPT-4o-mini | Simple, high-volume tasks |
| Embedding Generation | text-embedding-005 | text-embedding-004 | Vector quality, dimension consistency |
| Code Generation (report templates) | Gemini 2.5 Pro | - | Template creation |

## 32.2 Model Gateway

```java
@Service
@RequiredArgsConstructor
public class LlmGatewayService {

    private final GeminiClient geminiClient;
    private final OpenAiClient openAiClient;

    /**
     * Route LLM calls with automatic fallback
     */
    public LlmResponse call(LlmRequest request) {
        try {
            // Primary: Gemini
            return geminiClient.generate(request);
        } catch (LlmServiceUnavailableException e) {
            log.warn("Gemini unavailable, falling back to OpenAI");
            // Fallback: OpenAI
            return openAiClient.generate(request);
        }
    }

    /**
     * Generate embeddings
     */
    public float[] embed(String text) {
        return geminiClient.embed(text, "text-embedding-005");
    }
}
```

## 32.3 Cost Optimization

| Model | Input Cost | Output Cost | Monthly Estimate (QMS) |
|-------|-----------|-------------|----------------------|
| Gemini 2.5 Pro | $1.25/1M tokens | $10.00/1M tokens | $200-400/month |
| Gemini 2.5 Flash | $0.075/1M tokens | $0.30/1M tokens | $30-60/month |
| text-embedding-005 | $0.00001/1K tokens | - | $10-20/month |
| **Total estimated** | | | **$240-480/month** |

---

# Chapter 33: Google Vertex AI Integration

## 33.1 Vertex AI Services Used

| Service | Purpose | Integration Point |
|---------|---------|-------------------|
| Vertex AI Gemini API | LLM inference | Agent reasoning |
| Vertex AI Embeddings | Vector generation | RAG pipeline |
| Document AI | OCR and form extraction | Document processing |
| Vertex AI Pipelines | ML model training | Predictive models |
| Model Garden | Open-source model hosting | Specialized models |

## 33.2 Configuration

```yaml
# application-ai.yml
vertex-ai:
  project-id: ${GOOGLE_CLOUD_PROJECT_ID}
  location: ${GOOGLE_CLOUD_LOCATION:us-central1}
  gemini:
    model: gemini-2.5-pro
    temperature: 0.1        # Low temperature for deterministic outputs
    max-output-tokens: 8192
    top-p: 0.95
  embedding:
    model: text-embedding-005
    dimension: 768
  document-ai:
    processor-id: ${DOCUMENT_AI_PROCESSOR_ID}
  safety:
    block-threshold: BLOCK_MEDIUM_AND_ABOVE
```

---

# Chapter 34: Google ADK Java Code Architecture

## 34.1 Package Structure

```
mlabs-qms-pharma/src/main/java/com/qmspharma/
  ai/
    agent/                           # Agent definitions
      SupervisorAgentBuilder.java
      DeviationAgentBuilder.java
      CapaAgentBuilder.java
      ComplaintAgentBuilder.java
      AuditAgentBuilder.java
      DocumentAgentBuilder.java
      TrainingAgentBuilder.java
      SupplierAgentBuilder.java
      EquipmentAgentBuilder.java
      NonconformanceAgentBuilder.java
      RiskAgentBuilder.java
      ChangeControlAgentBuilder.java
      RegulatoryIntelligenceAgentBuilder.java
      PredictiveComplianceAgentBuilder.java
      RootCauseAgentBuilder.java
      AiCopilotBuilder.java
      WorkflowOrchestratorBuilder.java

    tool/                            # Tool implementations
      deviation/
        DeviationClassifyTool.java
        DeviationSearchTool.java
        DeviationImpactTool.java
        DeviationReportTool.java
      capa/
        CapaRcaTool.java
        CapaActionPlanTool.java
        CapaEffectivenessTool.java
      complaint/
        ComplaintTriageTool.java
        ComplaintTrendTool.java
        ComplaintResponseTool.java
      audit/
        AuditPlanTool.java
        AuditChecklistTool.java
        AuditEvidenceTool.java
        AuditReportTool.java
      document/
        DocumentDraftTool.java
        DocumentCompareTool.java
        DocumentValidateTool.java
      training/
        TrainingGapTool.java
        TrainingPathTool.java
      supplier/
        SupplierRiskTool.java
        SupplierCertTool.java
      equipment/
        EquipmentMaintenanceTool.java
        CalibrationImpactTool.java
      risk/
        RiskScoreTool.java
        RiskTrendTool.java
      change/
        ChangeImpactTool.java
        ChangeFilingTool.java
      workflow/
        WorkflowInboxTool.java
        WorkflowCompleteTool.java
      search/
        SemanticSearchTool.java
        FullTextSearchTool.java
      analytics/
        KpiTool.java
        TrendTool.java
        ComplianceScoreTool.java

    mcp/                             # MCP server configuration
      QmsMcpServerConfig.java
      DeviationMcpTools.java
      CapaMcpTools.java
      // ... more MCP tool registrations

    memory/                          # Agent memory management
      AgentMemoryService.java
      AgentSessionService.java

    rag/                             # RAG pipeline
      RagIngestionService.java
      RagRetrievalService.java
      TextChunker.java
      EmbeddingService.java

    llm/                             # LLM integration
      LlmGatewayService.java
      GeminiClient.java
      OpenAiClient.java
      PromptTemplateService.java
      PromptValidationService.java

    intelligence/                    # AI intelligence services
      ClassificationEngine.java
      AdverseEventDetector.java
      PredictiveModel.java
      SignalDetector.java
      CorrelationEngine.java
      PatternDetector.java

    graph/                           # Knowledge graph
      KnowledgeGraphService.java
      GraphSyncService.java

    audit/                           # AI audit trail
      AiAuditTrailService.java
      AiAuditTrailRepository.java

    event/                           # AI event handling
      CrossModuleEventHandler.java
      AiEventListener.java

    config/                          # AI configuration
      AiConfig.java
      VertexAiConfig.java
      VectorStoreConfig.java
      AgentRegistryConfig.java

    dto/                             # AI-specific DTOs
      ClassificationSuggestion.java
      RootCauseSuggestion.java
      ImpactAnalysis.java
      ComplianceScorecard.java
      // ... more DTOs

    controller/                      # AI API endpoints
      AiCopilotController.java
      AiAgentController.java
      AiAnalyticsController.java
```

---

# Chapter 35: Java Package Structure

## 35.1 Maven Dependencies for AI Module

```xml
<!-- Add to existing pom.xml -->

<!-- Google ADK Java -->
<dependency>
    <groupId>com.google.adk</groupId>
    <artifactId>google-adk-java</artifactId>
    <version>1.0.0</version>
</dependency>

<!-- Vertex AI SDK -->
<dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-vertexai</artifactId>
    <version>2.0.0</version>
</dependency>

<!-- Google Document AI -->
<dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-document-ai</artifactId>
    <version>2.50.0</version>
</dependency>

<!-- pgvector Java -->
<dependency>
    <groupId>com.pgvector</groupId>
    <artifactId>pgvector</artifactId>
    <version>0.1.6</version>
</dependency>

<!-- Redis for session/cache -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<!-- Elasticsearch -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
</dependency>

<!-- Google Pub/Sub -->
<dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>spring-cloud-gcp-pubsub</artifactId>
    <version>${spring-cloud-gcp.version}</version>
</dependency>
```

---

# Chapter 36: Spring Boot Integration

## 36.1 AI Configuration

```java
@Configuration
@EnableAsync
public class AiConfig {

    @Bean
    @ConditionalOnProperty(name = "ai.enabled", havingValue = "true")
    public AgentRuntime agentRuntime(AgentRegistryConfig registryConfig) {
        return AgentRuntime.builder()
            .agentRegistry(registryConfig.agentRegistry())
            .sessionStore(redisSessionStore())
            .build();
    }

    @Bean
    public EmbeddingService embeddingService(VertexAiConfig vertexConfig) {
        return new VertexAiEmbeddingService(vertexConfig);
    }

    @Bean
    public LlmGatewayService llmGateway(
            GeminiClient gemini, OpenAiClient openai) {
        return new LlmGatewayService(gemini, openai);
    }
}
```

## 36.2 Graceful Degradation

```java
@Aspect
@Component
public class AiGracefulDegradationAspect {

    /**
     * If AI service fails, operations continue with manual workflow.
     * AI is advisory, not mandatory.
     */
    @Around("@annotation(AiAssisted)")
    public Object handleAiFailure(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            return joinPoint.proceed();
        } catch (AiServiceUnavailableException e) {
            log.warn("AI service unavailable for {}: {}. "
                + "Continuing with manual workflow.",
                joinPoint.getSignature().getName(), e.getMessage());

            // Return empty/default AI suggestion
            return createEmptyAiResponse(joinPoint.getSignature().getReturnType());
        }
    }
}
```

---

# Chapter 37: BPMN & Flowable Integration

## 37.1 AI-Enhanced Flowable Delegates

The existing Flowable BPMN processes are enhanced with AI service task delegates:

```java
/**
 * Flowable delegate that triggers AI classification when a deviation
 * reaches the QA Review step.
 */
@Component("aiClassificationDelegate")
@RequiredArgsConstructor
public class AiClassificationDelegate implements JavaDelegate {

    private final AgentRegistry agentRegistry;
    private final AiSuggestionService suggestionService;

    @Override
    public void execute(DelegateExecution execution) {
        String deviationId = (String) execution.getVariable("recordId");
        String deviationNumber = (String) execution.getVariable("deviationNumber");

        try {
            // Invoke Deviation Agent for classification
            ClassificationSuggestion suggestion = agentRegistry
                .get("deviation")
                .invoke("classify_deviation", deviationId);

            // Store suggestion for QA Reviewer to see
            suggestionService.storeSuggestion(
                AiSuggestion.builder()
                    .type("CLASSIFICATION")
                    .sourceModule("DEVIATION")
                    .sourceRecordId(UUID.fromString(deviationId))
                    .suggestion(suggestion)
                    .confidence(suggestion.getConfidence())
                    .requiresHumanApproval(true)
                    .build());

            // Set process variable for UI to display
            execution.setVariable("aiClassificationSuggestion",
                objectMapper.writeValueAsString(suggestion));
            execution.setVariable("aiClassificationConfidence",
                suggestion.getConfidence());

        } catch (Exception e) {
            // AI failure does not block workflow
            log.warn("AI classification failed for {}: {}",
                deviationNumber, e.getMessage());
            execution.setVariable("aiClassificationAvailable", false);
        }
    }
}
```

## 37.2 Enhanced BPMN Process (Deviation with AI)

```xml
<!-- Add AI service task before QA Review in deviation-process.bpmn20.xml -->
<serviceTask id="aiClassify" name="AI Auto-Classification"
    flowable:delegateExpression="${aiClassificationDelegate}">
</serviceTask>

<!-- Wire it: Start -> aiClassify -> qaReview -->
<sequenceFlow sourceRef="startEvent" targetRef="aiClassify"/>
<sequenceFlow sourceRef="aiClassify" targetRef="qaReview"/>
```

---

# Chapter 38: Event Bus Architecture

## 38.1 Google Pub/Sub Topics

```java
@Configuration
public class PubSubConfig {

    // QMS Module Events
    public static final String DEVIATION_CREATED = "qms.deviation.created";
    public static final String DEVIATION_CLASSIFIED = "qms.deviation.classified";
    public static final String DEVIATION_CLOSED = "qms.deviation.closed";
    public static final String CAPA_CREATED = "qms.capa.created";
    public static final String CAPA_CLOSED = "qms.capa.closed";
    public static final String COMPLAINT_RECEIVED = "qms.complaint.received";
    public static final String COMPLAINT_AE_DETECTED = "qms.complaint.adverse-event";
    public static final String AUDIT_FINDING_CREATED = "qms.audit.finding-created";
    public static final String DOCUMENT_APPROVED = "qms.document.approved";
    public static final String TRAINING_COMPLETED = "qms.training.completed";
    public static final String EQUIPMENT_CAL_FAILED = "qms.equipment.cal-failed";
    public static final String NC_IDENTIFIED = "qms.nc.identified";
    public static final String SUPPLIER_SCORE_CHANGED = "qms.supplier.score-changed";
    public static final String RISK_THRESHOLD_EXCEEDED = "qms.risk.threshold-exceeded";
    public static final String CHANGE_APPROVED = "qms.change.approved";

    // AI Agent Events
    public static final String AI_SUGGESTION_CREATED = "qms.ai.suggestion-created";
    public static final String AI_SUGGESTION_ACCEPTED = "qms.ai.suggestion-accepted";
    public static final String AI_SUGGESTION_REJECTED = "qms.ai.suggestion-rejected";
}
```

## 38.2 Event Publisher

```java
@Service
@RequiredArgsConstructor
public class QmsEventPublisher {

    private final PubSubTemplate pubSubTemplate;

    public void publishDeviationCreated(Deviation deviation) {
        QmsEvent event = QmsEvent.builder()
            .eventType("DEVIATION_CREATED")
            .recordId(deviation.getId())
            .recordNumber(deviation.getDeviationNumber())
            .module("DEVIATION")
            .plantSiteId(deviation.getPlantSite().getId())
            .userId(deviation.getCreatedBy().getId())
            .timestamp(Instant.now())
            .payload(Map.of(
                "category", deviation.getCategory().name(),
                "type", deviation.getType().name(),
                "description", deviation.getDescription()
            ))
            .build();

        pubSubTemplate.publish(PubSubConfig.DEVIATION_CREATED,
            objectMapper.writeValueAsString(event));
    }
}
```

## 38.3 AI Event Subscriber

```java
@Component
@RequiredArgsConstructor
public class AiEventSubscriber {

    private final AgentRegistry agentRegistry;

    @PubSubListener(subscription = "qms-ai-deviation-sub",
                    topic = PubSubConfig.DEVIATION_CREATED)
    public void onDeviationCreated(QmsEvent event) {
        // Trigger AI auto-classification
        agentRegistry.get("deviation").invokeAsync(
            "classify_deviation", event.getRecordId().toString());
    }

    @PubSubListener(subscription = "qms-ai-complaint-sub",
                    topic = PubSubConfig.COMPLAINT_RECEIVED)
    public void onComplaintReceived(QmsEvent event) {
        // Trigger AI triage
        agentRegistry.get("complaint").invokeAsync(
            "triage_complaint", event.getRecordId().toString());
    }

    @PubSubListener(subscription = "qms-ai-cal-failure-sub",
                    topic = PubSubConfig.EQUIPMENT_CAL_FAILED)
    public void onCalibrationFailed(QmsEvent event) {
        // Trigger AI impact analysis
        agentRegistry.get("equipment").invokeAsync(
            "analyze_calibration_failure_impact",
            event.getPayload().get("calibrationRecordId").toString());
    }
}
```

---

# Chapter 39: Kafka/RabbitMQ Integration (Alternative)

## 39.1 When to Use Kafka vs Pub/Sub

| Criterion | Google Pub/Sub | Apache Kafka |
|-----------|---------------|--------------|
| GCP Native | Yes | No (self-managed) |
| Ordering Guarantee | Per-partition | Per-partition |
| Retention | 7 days default | Configurable |
| Cost | Pay-per-message | Infrastructure cost |
| Best For | Cloud-native, low ops | High throughput, replay |
| Recommendation | **Primary choice** (GCP deployment) | On-premise deployments |

## 39.2 Kafka Configuration (If Selected)

```yaml
# application-kafka.yml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      group-id: qms-ai-agents
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
```

---

# Chapter 40: PostgreSQL + Vector Database Design

## 40.1 Unified Database Strategy

Rather than introducing a separate vector database, the architecture extends the existing PostgreSQL 17 with pgvector. This provides:

- **Unified transactions**: Vector operations participate in the same transactions as QMS data
- **Consistent backups**: One backup strategy covers both operational and AI data
- **Simplified ops**: No additional database to manage
- **ACID compliance**: Critical for 21 CFR Part 11

## 40.2 AI-Specific Schema (Flyway Migration)

```sql
-- V24__ai_agent_infrastructure.sql

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Agent Audit Trail (21 CFR Part 11 compliant)
CREATE TABLE ai_agent_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    record_type VARCHAR(50),
    record_id UUID,
    user_id UUID REFERENCES users(id),
    input_summary TEXT,
    output_summary TEXT,
    confidence DOUBLE PRECISION,
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    prompt_template_name VARCHAR(100),
    prompt_template_version VARCHAR(20),
    tool_calls JSONB DEFAULT '[]',
    tokens_used INTEGER,
    latency_ms INTEGER,
    status VARCHAR(20) NOT NULL, -- SUCCESS, FAILURE, TIMEOUT, LOW_CONFIDENCE
    error_message TEXT,
    human_decision VARCHAR(20), -- ACCEPTED, REJECTED, MODIFIED, PENDING
    human_decision_by UUID REFERENCES users(id),
    human_decision_at TIMESTAMP WITH TIME ZONE,
    human_modification TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID REFERENCES organizations(id),
    plant_site_id UUID REFERENCES plant_sites(id)
);

-- AI Suggestions (pending human approval)
CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    source_module VARCHAR(50) NOT NULL,
    source_record_id UUID,
    target_module VARCHAR(50),
    target_record_id UUID,
    suggestion JSONB NOT NULL,
    confidence DOUBLE PRECISION,
    reasoning TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, EXPIRED
    assigned_to UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    auto_expire_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID REFERENCES organizations(id)
);

-- Indexes
CREATE INDEX idx_ai_audit_agent ON ai_agent_audit_trail(agent_name, created_at);
CREATE INDEX idx_ai_audit_record ON ai_agent_audit_trail(record_type, record_id);
CREATE INDEX idx_ai_audit_user ON ai_agent_audit_trail(user_id, created_at);
CREATE INDEX idx_ai_audit_status ON ai_agent_audit_trail(status);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status, assigned_to);
CREATE INDEX idx_ai_suggestions_module ON ai_suggestions(source_module, source_record_id);
```

---

# Chapter 41: ElasticSearch Integration

## 41.1 Purpose

Elasticsearch provides full-text search with analytics aggregations across QMS records, complementing pgvector's semantic search:

- **Full-text search** with pharma-specific analyzers (handling terms like "OOS", "CAPA", "21 CFR")
- **Real-time analytics** for dashboards and trend charts
- **Log aggregation** for AI agent observability

## 41.2 Index Mapping

```json
{
  "qms_records": {
    "mappings": {
      "properties": {
        "record_type": { "type": "keyword" },
        "record_number": { "type": "keyword" },
        "status": { "type": "keyword" },
        "classification": { "type": "keyword" },
        "category": { "type": "keyword" },
        "description": { "type": "text", "analyzer": "pharma_analyzer" },
        "root_cause": { "type": "text", "analyzer": "pharma_analyzer" },
        "investigation_summary": { "type": "text" },
        "area": { "type": "keyword" },
        "department_id": { "type": "keyword" },
        "plant_site_id": { "type": "keyword" },
        "created_date": { "type": "date" },
        "closed_date": { "type": "date" },
        "assigned_to": { "type": "keyword" },
        "product_code": { "type": "keyword" },
        "batch_number": { "type": "keyword" },
        "equipment_name": { "type": "keyword" },
        "supplier_id": { "type": "keyword" },
        "tags": { "type": "keyword" }
      }
    },
    "settings": {
      "analysis": {
        "analyzer": {
          "pharma_analyzer": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "pharma_synonyms", "pharma_stopwords"]
          }
        },
        "filter": {
          "pharma_synonyms": {
            "type": "synonym",
            "synonyms": [
              "OOS, out of specification",
              "OOT, out of trend",
              "CAPA, corrective and preventive action",
              "NC, nonconformance, non-conformance",
              "GMP, good manufacturing practice",
              "SOP, standard operating procedure"
            ]
          }
        }
      }
    }
  }
}
```

---

# Chapter 42: REST API Design for AI Agents

## 42.1 AI Copilot API

```
POST   /api/v1/ai/chat                          - Conversational AI query
GET    /api/v1/ai/chat/history                   - Chat history for user
DELETE /api/v1/ai/chat/sessions/{sessionId}      - Clear session

POST   /api/v1/ai/agents/{agentName}/invoke      - Direct agent invocation
GET    /api/v1/ai/agents                          - List available agents
GET    /api/v1/ai/agents/{agentName}/tools        - List agent tools

GET    /api/v1/ai/suggestions                     - List pending AI suggestions
PUT    /api/v1/ai/suggestions/{id}/accept          - Accept AI suggestion
PUT    /api/v1/ai/suggestions/{id}/reject          - Reject AI suggestion

GET    /api/v1/ai/audit-trail                      - AI audit trail (admin)
GET    /api/v1/ai/analytics/compliance-score       - Compliance scorecard
GET    /api/v1/ai/analytics/predictions            - Quality predictions
GET    /api/v1/ai/analytics/inspection-readiness   - Inspection readiness

GET    /api/v1/ai/training-gaps                    - Training gap report
GET    /api/v1/ai/supplier-risks                   - Supplier risk scores
GET    /api/v1/ai/regulatory-updates               - Regulatory updates
```

## 42.2 Request/Response Format

```java
// Chat Request
public record ChatRequest(
    String message,
    String sessionId, // optional, for conversation continuity
    Map<String, Object> context // optional, current record context
) {}

// Chat Response
public record ChatResponse(
    String message,
    double confidence,
    List<Source> sources,
    List<SuggestedAction> suggestedActions,
    UUID requestId, // for audit trail reference
    String agentUsed
) {}

// AI Suggestion
public record AiSuggestionResponse(
    UUID id,
    String type,
    String sourceModule,
    String sourceRecordNumber,
    Object suggestion,
    double confidence,
    String reasoning,
    String status,
    LocalDateTime createdAt
) {}
```

---

# Chapter 43: AI Governance & Explainability

## 43.1 AI Governance Framework

### 43.1.1 Governance Board
- **AI Quality Committee**: Reviews AI model performance quarterly
- **Members**: Quality Director, IT Director, Regulatory Affairs, QA Manager
- **Responsibilities**: Approve prompt templates, review AI accuracy metrics, validate model updates

### 43.1.2 AI Risk Classification (EU AI Act Aligned)

| QMS AI Function | Risk Level | Justification | Controls |
|----------------|------------|---------------|----------|
| Deviation Classification | High | Affects product quality decisions | Human confirmation required, confidence gating |
| CAPA RCA Suggestion | Limited | Advisory only, human decides | Audit trail, explainability |
| Complaint AE Detection | High | Patient safety implication | Immediate human escalation, zero-miss target |
| Audit Checklist Generation | Limited | Advisory | Human review of checklist |
| SOP Drafting | Limited | Advisory, human approves | GxP validation, review workflow |
| Predictive Compliance | Minimal | Informational | Dashboard-level, no automated action |
| Training Gap Detection | Limited | Compliance impact | Human review before action |
| Supplier Risk Scoring | Limited | Advisory | Human review of scores |

### 43.1.3 Explainability Requirements

Every AI recommendation must include:
1. **Confidence Score** (0.0 - 1.0)
2. **Reasoning Chain** (step-by-step logic)
3. **Evidence Citations** (document numbers, historical records)
4. **Similar Historical Cases** (with outcomes)
5. **Model Information** (model name, version, prompt template version)
6. **Limitations Statement** (what the AI does NOT know)

```java
public record AiExplanation(
    double confidence,
    String reasoning,
    List<Citation> citations,
    List<SimilarCase> similarCases,
    String modelName,
    String modelVersion,
    String promptTemplateVersion,
    List<String> limitations,
    List<String> alternativeInterpretations
) {}
```

---

# Chapter 44: 21 CFR Part 11 Compliance for AI

## 44.1 Regulatory Requirements Mapping

| CFR Part 11 Requirement | AI Implementation |
|------------------------|-------------------|
| 11.10(a) System validation | GAMP5 Category 5 validation for AI components |
| 11.10(b) Accurate copies | AI audit trail with complete input/output records |
| 11.10(c) Record protection | Immutable ai_agent_audit_trail table, no DELETE |
| 11.10(d) Access controls | Tool permission validator, user role checking |
| 11.10(e) Audit trail | Comprehensive AI audit trail with timestamps, user IDs |
| 11.50 Signature manifestation | AI decisions linked to human e-signatures for GxP steps |
| 11.70 Signature linking | AI suggestion ID linked to human approval e-signature ID |
| 11.100 General requirements | AI as electronic record system with full traceability |
| 11.200 Electronic signatures | Human e-signature required for all AI-recommended GxP actions |
| 11.300 Controls | Biometric/password controls maintained for human approvals |

## 44.2 AI Audit Trail Requirements

```sql
-- Every AI interaction is immutable and traceable
-- No UPDATE or DELETE allowed on this table
-- Enforced via database triggers and application-level controls

CREATE OR REPLACE FUNCTION prevent_ai_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Only allow updating human_decision fields
        IF OLD.agent_name != NEW.agent_name
           OR OLD.input_summary != NEW.input_summary
           OR OLD.output_summary != NEW.output_summary THEN
            RAISE EXCEPTION 'AI audit trail records are immutable';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'AI audit trail records cannot be deleted';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_audit_immutable
    BEFORE UPDATE OR DELETE ON ai_agent_audit_trail
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ai_audit_modification();
```

---

# Chapter 45: GAMP5 AI Validation

## 45.1 GAMP5 Category Classification

| AI Component | GAMP5 Category | Validation Approach |
|-------------|---------------|---------------------|
| Google ADK Framework | Cat 4 (Configured) | Configuration qualification |
| Agent Definitions | Cat 5 (Custom) | Full V-model validation |
| Tool Implementations | Cat 5 (Custom) | Unit + integration testing |
| Prompt Templates | Cat 5 (Custom) | Validation against golden datasets |
| RAG Pipeline | Cat 5 (Custom) | Retrieval accuracy testing |
| Predictive Models | Cat 5 (Custom) | Model validation protocol |
| Vector Database | Cat 4 (Configured) | Configuration qualification |
| LLM Models (Gemini) | Infrastructure | Supplier qualification |

## 45.2 Validation Protocol Structure

```
1. Validation Plan (VP)
   - Scope: AI Agent components
   - Approach: Risk-based (ICH Q9)
   - Acceptance criteria per agent

2. User Requirements Specification (URS)
   - Functional requirements per agent
   - Performance requirements (latency, accuracy)
   - Regulatory requirements (21 CFR Part 11)

3. Functional Specification (FS)
   - Agent behavior specifications
   - Tool input/output specifications
   - Error handling specifications

4. Design Specification (DS)
   - Architecture design
   - Data flow design
   - Integration design

5. Installation Qualification (IQ)
   - Infrastructure verification
   - Dependency verification
   - Configuration verification

6. Operational Qualification (OQ)
   - Functional testing per agent
   - Prompt template accuracy testing
   - RAG retrieval accuracy testing
   - Cross-module integration testing
   - Performance testing
   - Security testing

7. Performance Qualification (PQ)
   - Production data testing
   - Accuracy benchmarking
   - User acceptance testing
   - Regulatory compliance testing

8. Validation Report (VR)
   - Test results summary
   - Deviation management
   - Acceptance conclusion
```

## 45.3 Golden Dataset for Validation

```java
/**
 * Golden dataset test for Deviation Classification Agent.
 * Must achieve >= 90% accuracy against validated test cases.
 */
@Test
@Tag("GAMP5_OQ")
public void testDeviationClassificationAccuracy() {
    List<GoldenTestCase> goldenCases = loadGoldenDataset(
        "deviation_classification_golden_v1.json");

    int correct = 0;
    for (GoldenTestCase testCase : goldenCases) {
        ClassificationSuggestion result = deviationAgent
            .classifyDeviation(testCase.getDeviationId());

        if (result.getSuggestedClassification()
                .equals(testCase.getExpectedClassification())) {
            correct++;
        }

        // Log each test result for audit trail
        validationLogger.log(testCase, result);
    }

    double accuracy = (double) correct / goldenCases.size();
    assertThat(accuracy).isGreaterThanOrEqualTo(0.90);
}
```

---

# Chapter 46: AI Audit Trail

## 46.1 Complete AI Traceability

Every AI agent interaction is recorded with:

```java
@Service
@RequiredArgsConstructor
public class AiAuditTrailService {

    private final AiAuditTrailRepository repository;

    public UUID logRequest(UUID userId, String input, String agentName) {
        AiAuditTrail entry = AiAuditTrail.builder()
            .requestId(UUID.randomUUID())
            .agentName(agentName)
            .action("QUERY")
            .userId(userId)
            .inputSummary(truncate(input, 2000))
            .status("IN_PROGRESS")
            .ipAddress(getCurrentIpAddress())
            .organizationId(getCurrentOrganizationId())
            .plantSiteId(getCurrentPlantSiteId())
            .build();

        return repository.save(entry).getRequestId();
    }

    public void logResponse(UUID requestId, String output,
            double confidence, String model,
            List<ToolCall> toolCalls) {
        AiAuditTrail entry = repository.findByRequestId(requestId);
        entry.setOutputSummary(truncate(output, 5000));
        entry.setConfidence(confidence);
        entry.setModelName(model);
        entry.setToolCalls(objectMapper.valueToTree(toolCalls));
        entry.setStatus(confidence >= 0.5 ? "SUCCESS" : "LOW_CONFIDENCE");
        entry.setLatencyMs(calculateLatency(entry.getCreatedAt()));
        repository.save(entry);
    }

    public void logHumanDecision(UUID requestId, String decision,
            UUID decidedBy, String modification) {
        AiAuditTrail entry = repository.findByRequestId(requestId);
        entry.setHumanDecision(decision); // ACCEPTED, REJECTED, MODIFIED
        entry.setHumanDecisionBy(decidedBy);
        entry.setHumanDecisionAt(Instant.now());
        entry.setHumanModification(modification);
        repository.save(entry);
    }
}
```

---

# Chapter 47: Agent Security

## 47.1 Security Architecture

### 47.1.1 Authentication
- AI API endpoints use the same JWT authentication as QMS APIs
- Agent actions are executed in the context of the authenticated user
- Service-to-service calls use GCP IAM service accounts

### 47.1.2 Authorization
- Every tool call is validated against user's QMS permissions
- AI agents cannot bypass the existing RBAC model
- Admin-only endpoints for AI configuration and audit trail access

### 47.1.3 Data Protection
- PII is masked before sending to LLM APIs
- Batch numbers and patient data are anonymized in prompts
- LLM API calls use VPC Service Controls on GCP

```java
@Component
public class PiiMaskingService {

    /**
     * Mask PII before sending to external LLM
     */
    public String maskPii(String text) {
        // Mask patient names
        text = text.replaceAll("\\b[A-Z][a-z]+ [A-Z][a-z]+\\b", "[PATIENT_NAME]");
        // Mask email addresses
        text = text.replaceAll("[\\w.]+@[\\w.]+\\.[a-zA-Z]+", "[EMAIL]");
        // Mask phone numbers
        text = text.replaceAll("\\b\\d{10,12}\\b", "[PHONE]");
        // Mask Aadhaar numbers
        text = text.replaceAll("\\b\\d{4}\\s?\\d{4}\\s?\\d{4}\\b", "[AADHAAR]");
        return text;
    }
}
```

### 47.1.4 Model Security
- Prompt injection detection before LLM calls
- Output sanitization before returning to users
- Rate limiting on AI API endpoints

---

# Chapter 48: Human-in-the-Loop Approvals

## 48.1 Approval Flow Architecture

```
AI Agent generates recommendation
  |
  v
Store in ai_suggestions table (status: PENDING)
  |
  v
Send notification to assigned reviewer
  |
  v
Reviewer sees AI suggestion in QMS UI with:
  - Confidence score
  - Reasoning chain
  - Evidence citations
  - Similar historical cases
  |
  v
Reviewer decides:
  [ACCEPT] -> Execute AI suggestion as-is
  [MODIFY] -> Adjust AI suggestion, then execute
  [REJECT] -> Discard AI suggestion, proceed manually
  |
  v
Log decision in ai_agent_audit_trail (human_decision field)
  |
  v
If GxP-critical: Electronic signature required
```

## 48.2 Integration with Existing E-Signature

```java
@Service
@RequiredArgsConstructor
public class AiApprovalService {

    private final AiSuggestionRepository suggestionRepository;
    private final ElectronicSignatureService eSignService;
    private final AiAuditTrailService aiAuditTrail;

    /**
     * Accept an AI suggestion with optional electronic signature
     */
    public void acceptSuggestion(UUID suggestionId, UUID userId,
            String password, String reason, boolean requiresESign) {

        AiSuggestion suggestion = suggestionRepository
            .findById(suggestionId).orElseThrow();

        // Electronic signature for GxP-critical AI decisions
        if (requiresESign) {
            ElectronicSignature eSig = eSignService.sign(
                userId, password,
                "ACCEPT_AI_SUGGESTION",
                reason,
                "AI_SUGGESTION",
                suggestionId);
            suggestion.setESignatureId(eSig.getId());
        }

        suggestion.setStatus("ACCEPTED");
        suggestion.setReviewedBy(userId);
        suggestion.setReviewedAt(Instant.now());
        suggestionRepository.save(suggestion);

        // Log human decision in AI audit trail
        aiAuditTrail.logHumanDecision(
            suggestion.getAiRequestId(),
            "ACCEPTED",
            userId,
            null);

        // Execute the accepted suggestion
        executeSuggestion(suggestion);
    }
}
```

## 48.3 GxP Decision Matrix

| AI Action | E-Signature Required | Human Review Required | Auto-Execute Allowed |
|-----------|---------------------|----------------------|---------------------|
| Deviation Classification | Yes (QA_REVIEWER) | Yes | No |
| CAPA Action Suggestion | No | Yes | No |
| Complaint AE Flag | No (alert) | Yes (urgently) | Alert auto-sent |
| Document Draft | No | Yes (review workflow) | Draft auto-saved |
| Training Assignment | No | Yes (coordinator) | No |
| Audit Checklist | No | Yes (lead auditor) | No |
| Risk Score Suggestion | No | Yes | No |
| Supplier Risk Alert | No | Yes | Alert auto-sent |
| Disposition Recommendation | Yes (QA_APPROVER) | Yes | No |
| CAPA Closure | Yes (QA_APPROVER) | Yes | No |

---

# Chapter 49: Production Deployment (Kubernetes/GCP)

## 49.1 GCP Architecture

```
Google Cloud Platform
=====================

+------------------+     +------------------+     +------------------+
| Cloud Run        |     | Cloud Run        |     | Cloud Run        |
| QMS API +        |     | AI Agent         |     | MCP Server       |
| AI Controllers   |     | Workers          |     |                  |
| (auto-scaling)   |     | (GPU optional)   |     |                  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
+--------v------------------------v------------------------v---------+
|                    VPC Network (Private)                            |
+--------+------------------------+------------------------+---------+
         |                        |                        |
+--------v---------+     +-------v--------+     +---------v--------+
| Cloud SQL        |     | Memorystore    |     | Pub/Sub          |
| PostgreSQL 17    |     | Redis          |     | Event Bus        |
| + pgvector       |     | Sessions/Cache |     |                  |
+------------------+     +----------------+     +------------------+
         |
+--------v---------+     +----------------+     +------------------+
| Cloud Storage    |     | Vertex AI      |     | Cloud Operations |
| Documents, SOPs  |     | Gemini API     |     | Logging,         |
|                  |     | Embeddings     |     | Monitoring,      |
|                  |     | Document AI    |     | Tracing          |
+------------------+     +----------------+     +------------------+
```

## 49.2 Cloud Run Configuration

```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: mlabs-qms-pharma
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
        - image: gcr.io/${PROJECT_ID}/mlabs-qms-pharma:${VERSION}
          ports:
            - containerPort: 8082
          resources:
            limits:
              memory: 2Gi
              cpu: "2"
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: gcp
            - name: AI_ENABLED
              value: "true"
            - name: VERTEX_AI_PROJECT_ID
              valueFrom:
                secretKeyRef:
                  name: vertex-ai-config
                  key: project-id
```

## 49.3 GKE Alternative (For Larger Deployments)

```yaml
# For organizations needing GPU nodes for local model hosting
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qms-ai-worker
spec:
  replicas: 2
  template:
    spec:
      nodeSelector:
        cloud.google.com/gke-accelerator: nvidia-tesla-t4
      containers:
        - name: ai-worker
          image: gcr.io/${PROJECT_ID}/qms-ai-worker:${VERSION}
          resources:
            limits:
              nvidia.com/gpu: 1
              memory: 8Gi
              cpu: "4"
```

---

# Chapter 50: Implementation Roadmap (12 Months)

## 50.1 Phase 1: Foundation (Months 1-3)

### Month 1: Infrastructure Setup
- [ ] Set up pgvector extension on Cloud SQL
- [ ] Deploy Redis Memorystore for sessions
- [ ] Configure Google Pub/Sub topics and subscriptions
- [ ] Add Google ADK Java dependency to project
- [ ] Create V24 Flyway migration for AI tables
- [ ] Set up Vertex AI project and API access

### Month 2: Core Agent Framework
- [ ] Implement Agent Registry and Session Service
- [ ] Implement AI Audit Trail Service
- [ ] Implement LLM Gateway Service (Gemini + fallback)
- [ ] Implement Embedding Service
- [ ] Implement RAG Ingestion Pipeline
- [ ] Implement Tool Registry and Permission Validator
- [ ] Build Supervisor Agent with intent routing

### Month 3: First Domain Agent (Deviation)
- [ ] Implement Deviation Agent with 5 core tools
- [ ] Implement auto-classification with golden dataset validation
- [ ] Implement historical similarity search
- [ ] Build AI Copilot chat API endpoint
- [ ] Implement Human-in-the-Loop approval flow
- [ ] Integration testing with existing deviation workflow
- [ ] GAMP5 OQ for Deviation Agent (accuracy >= 90%)

## 50.2 Phase 2: Core Agents (Months 4-6)

### Month 4: CAPA + Complaint Agents
- [ ] CAPA Agent: RCA assistance, action plan generation, effectiveness prediction
- [ ] Complaint Agent: triage, adverse event detection, response drafting
- [ ] Cross-module chain: Deviation -> CAPA
- [ ] Cross-module chain: Complaint -> Deviation -> CAPA

### Month 5: Audit + Document Agents
- [ ] Audit Agent: checklist generation, evidence compilation, report drafting
- [ ] Document Agent: SOP drafting, GxP validation, revision comparison
- [ ] Cross-module chain: Audit Finding -> CAPA
- [ ] Cross-module chain: Document Approval -> Training

### Month 6: Training + Supplier + Equipment Agents
- [ ] Training Agent: gap detection, learning path generation
- [ ] Supplier Agent: risk prediction, certificate monitoring
- [ ] Equipment Agent: predictive maintenance, calibration impact
- [ ] Cross-module chains for these modules

## 50.3 Phase 3: Advanced Agents (Months 7-9)

### Month 7: Remaining Domain Agents
- [ ] Risk Agent: scoring, trend analysis
- [ ] Change Control Agent: impact assessment, filing determination
- [ ] Nonconformance Agent: classification, disposition recommendation
- [ ] Workflow Orchestrator: all 10 cross-module chains

### Month 8: Cross-Cutting Agents
- [ ] Root Cause Investigation Agent
- [ ] Regulatory Intelligence Agent
- [ ] Predictive Compliance Agent
- [ ] Knowledge Graph implementation

### Month 9: AI Copilot Enhancement
- [ ] Full natural language interface
- [ ] Multi-turn conversation support
- [ ] Context-aware suggestions
- [ ] Dashboard integration
- [ ] Elasticsearch integration for analytics

## 50.4 Phase 4: Production Hardening (Months 10-12)

### Month 10: Validation & Security
- [ ] GAMP5 PQ for all agents
- [ ] 21 CFR Part 11 compliance audit
- [ ] Security penetration testing
- [ ] PII masking validation
- [ ] Performance optimization

### Month 11: Production Deployment
- [ ] Staged rollout (pilot plant site first)
- [ ] User training program
- [ ] Monitoring and alerting setup
- [ ] Feedback loop implementation

### Month 12: Optimization & Documentation
- [ ] Agent accuracy tuning based on production feedback
- [ ] Prompt template optimization
- [ ] RAG knowledge base expansion
- [ ] Complete validation documentation
- [ ] Regulatory submission package preparation

---

# Chapter 51: Cost Estimation

## 51.1 Infrastructure Costs (Monthly)

| Component | Service | Estimated Cost |
|-----------|---------|---------------|
| Compute | Cloud Run (QMS API + AI) | $150-300 |
| Database | Cloud SQL PostgreSQL (with pgvector) | $200-400 |
| Cache | Memorystore Redis | $50-100 |
| Events | Pub/Sub | $10-30 |
| Storage | Cloud Storage | $20-50 |
| AI/ML | Vertex AI (Gemini API) | $200-500 |
| AI/ML | Document AI (OCR) | $50-100 |
| Search | Elasticsearch (Elastic Cloud) | $100-200 |
| Monitoring | Cloud Operations | $30-50 |
| **Total Infrastructure** | | **$810-1,730/month** |

## 51.2 Development Costs

| Phase | Duration | Team Size | Estimated Cost |
|-------|----------|-----------|---------------|
| Phase 1: Foundation | 3 months | 2-3 developers | $30,000-50,000 |
| Phase 2: Core Agents | 3 months | 3-4 developers | $50,000-80,000 |
| Phase 3: Advanced | 3 months | 3-4 developers | $50,000-80,000 |
| Phase 4: Production | 3 months | 2-3 developers | $30,000-50,000 |
| Validation (GAMP5) | Continuous | 1 QA specialist | $20,000-30,000 |
| **Total Development** | **12 months** | | **$180,000-290,000** |

## 51.3 ROI Analysis

| Metric | Annual Manual Cost | Annual AI-Assisted Cost | Savings |
|--------|-------------------|----------------------|---------|
| Deviation Processing | $120,000 (labor) | $30,000 | $90,000 |
| CAPA Management | $150,000 (labor) | $45,000 | $105,000 |
| Audit Preparation | $80,000 (labor) | $20,000 | $60,000 |
| Document Management | $60,000 (labor) | $20,000 | $40,000 |
| Training Administration | $40,000 (labor) | $15,000 | $25,000 |
| Compliance Risk (avoided) | $200,000 (est. penalties) | $50,000 | $150,000 |
| **Total Annual Savings** | | | **$470,000** |

**Payback Period: 5-8 months** (development cost recovered within first year)

---

# Chapter 52: Future Vision: Autonomous Pharma Plant

## 52.1 Maturity Model

```
Level 1 (Current): Manual QMS
  - Humans initiate all records
  - Manual investigation and classification
  - Paper-based or basic digital workflows

Level 2 (Phase 1-2): AI-Assisted QMS
  - AI suggests classifications and root causes
  - Human reviews and confirms
  - Automated evidence compilation
  - Faster cycle times (40-60% reduction)

Level 3 (Phase 3-4): AI-Augmented QMS
  - Predictive quality events
  - Cross-module AI orchestration
  - Continuous compliance monitoring
  - Near-real-time inspection readiness

Level 4 (Year 2-3): Semi-Autonomous QMS
  - AI handles routine quality events autonomously
  - Human oversight for critical/major decisions only
  - Self-healing quality systems
  - Regulatory intelligence driving proactive compliance

Level 5 (Year 4-5): Autonomous Quality Operations
  - Digital twin of quality operations
  - AI-driven process optimization
  - Predictive batch release
  - Autonomous supplier management
  - Zero-defect manufacturing vision
```

## 52.2 Future AI Capabilities

### 52.2.1 Digital Twin
- Virtual replica of manufacturing processes
- Simulation of quality events before they happen
- Optimization of process parameters for quality

### 52.2.2 Predictive Batch Release
- AI predicts batch quality based on in-process data
- Reduces release testing time by 50-70%
- Maintains full regulatory compliance

### 52.2.3 Autonomous Supplier Management
- Real-time supply chain risk monitoring
- Automatic qualification renewals
- Predictive material quality assessment

### 52.2.4 Self-Healing Quality Systems
- AI detects emerging quality trends
- Automatically initiates preventive actions
- Closes loop between detection and correction

---

# Chapter 53: Appendix

## A. Agent Interaction Sequence Diagrams

### A.1 Deviation AI-Assisted Classification Flow

```
User          Angular UI       API           Deviation       Supervisor     Deviation
                                             Service         Agent          Agent
  |               |              |              |              |              |
  |--create dev-->|              |              |              |              |
  |               |--POST /api-->|              |              |              |
  |               |              |--create()-->|              |              |
  |               |              |              |--save DB---->|              |
  |               |              |              |--start BPMN->|              |
  |               |              |              |--publish---->|              |
  |               |              |              |   Pub/Sub    |              |
  |               |              |              |              |--event------>|
  |               |              |              |              |              |
  |               |              |              |              |  classify()  |
  |               |              |              |              |<--suggest----|
  |               |              |              |              |              |
  |               |              |              |<--store AI suggestion------|
  |               |              |              |--notify QA-->|              |
  |               |              |              |              |              |
  |<--notification|              |              |              |              |
  |               |              |              |              |              |
  |--open dev---->|              |              |              |              |
  |               |--GET /api--->|              |              |              |
  |               |              |--getById()--->|              |              |
  |               |<--dev + AI suggestion-------|              |              |
  |               |              |              |              |              |
  |--confirm----->|              |              |              |              |
  |  (e-sign)     |--PUT classify|              |              |              |
  |               |              |--classify()-->|              |              |
  |               |              |              |--complete task|              |
  |               |              |              |--log audit--->|              |
  |               |<--200 OK-----|              |              |              |
```

### A.2 Cross-Module Chain: Complaint -> CAPA -> Change Control

```
Complaint      Complaint    CAPA        Change        Supervisor
Agent          Service      Agent       Control       Agent
  |              |            |          Agent          |
  |--triage()--->|            |            |            |
  |  AE detected |            |            |            |
  |              |            |            |            |
  |--recommend-->|            |            |            |
  |  CAPA needed |            |            |            |
  |              |            |            |            |
  |              |--event---->|            |            |
  |              | CAPA_NEEDED|            |            |
  |              |            |            |            |
  |              |            |--create    |            |
  |              |            |  suggestion|            |
  |              |            |            |            |
  |              |  [Human confirms CAPA creation]     |
  |              |            |            |            |
  |              |            |--RCA()---->|            |
  |              |            |  suggest   |            |
  |              |            |  root cause|            |
  |              |            |            |            |
  |              |            |--actions-->|            |
  |              |            |  generate  |            |
  |              |            |  plan      |            |
  |              |            |            |            |
  |              |            |--assess--->|            |
  |              |            |  if change |            |
  |              |            |  needed    |            |
  |              |            |            |            |
  |              |            |            |--suggest-->|
  |              |            |            |  change req|
  |              |            |            |            |
  |              |  [Human confirms Change Request]    |
```

## B. Complete Tool Inventory

| # | Tool Name | Agent | Module | Description |
|---|-----------|-------|--------|-------------|
| 1 | classify_deviation | Deviation | Deviation | Auto-classify Critical/Major/Minor |
| 2 | search_historical_deviations | Deviation | Deviation | Vector similarity search |
| 3 | analyze_deviation_impact | Deviation | Deviation | Cross-module impact analysis |
| 4 | draft_investigation_report | Deviation | Deviation | Generate investigation report |
| 5 | recommend_capa | Deviation | Deviation | CAPA recommendation |
| 6 | suggest_root_causes | Deviation | Deviation | Historical root cause matching |
| 7 | assist_five_why_analysis | CAPA | CAPA | Guided 5-Why RCA |
| 8 | assist_fishbone_analysis | CAPA | CAPA | Ishikawa diagram generation |
| 9 | generate_capa_action_plan | CAPA | CAPA | Action plan from root cause |
| 10 | predict_capa_effectiveness | CAPA | CAPA | Effectiveness prediction |
| 11 | check_capa_recurrence | CAPA | CAPA | Cross-module recurrence check |
| 12 | triage_complaint | Complaint | Complaint | Severity + AE detection |
| 13 | analyze_complaint_trends | Complaint | Complaint | Product complaint trending |
| 14 | draft_complaint_response | Complaint | Complaint | Response letter generation |
| 15 | assess_recall_risk | Complaint | Complaint | Recall necessity assessment |
| 16 | generate_audit_plan | Audit | Audit | Risk-based audit planning |
| 17 | generate_audit_checklist | Audit | Audit | Dynamic checklist generation |
| 18 | compile_audit_evidence | Audit | Audit | Evidence package compilation |
| 19 | classify_audit_finding | Audit | Audit | Finding classification |
| 20 | draft_audit_report | Audit | Audit | Audit report generation |
| 21 | draft_sop | Document | Document | SOP drafting |
| 22 | compare_document_versions | Document | Document | Revision comparison |
| 23 | validate_gxp_terminology | Document | Document | GxP language validation |
| 24 | identify_training_needs | Document | Training | Training impact analysis |
| 25 | detect_training_gaps | Training | Training | Gap detection |
| 26 | generate_learning_path | Training | Training | Personalized learning paths |
| 27 | assess_training_effectiveness | Training | Training | Training ROI analysis |
| 28 | predict_supplier_risk | Supplier | Supplier | Supplier risk scoring |
| 29 | assess_supplier_qualification | Supplier | Supplier | Qualification assessment |
| 30 | monitor_supplier_certificates | Supplier | Supplier | Certificate expiry monitoring |
| 31 | predict_maintenance_needs | Equipment | Equipment | Predictive maintenance |
| 32 | analyze_calibration_failure_impact | Equipment | Equipment | Cal failure impact |
| 33 | classify_nonconformance | NC | NC | NC classification |
| 34 | recommend_disposition | NC | NC | Disposition recommendation |
| 35 | suggest_risk_scores | Risk | Risk | FMEA score suggestion |
| 36 | analyze_risk_trends | Risk | Risk | RPN trending analysis |
| 37 | auto_impact_assessment | Change | Change | 8-dimension impact assessment |
| 38 | determine_regulatory_filing | Change | Change | Filing type determination |
| 39 | monitor_regulatory_updates | Regulatory | Regulatory | Guideline monitoring |
| 40 | assess_inspection_readiness | Regulatory | Compliance | Readiness scoring |
| 41 | calculate_compliance_score | Predictive | Compliance | Compliance scorecard |
| 42 | predict_quality_events | Predictive | Compliance | Event prediction |
| 43 | perform_root_cause_analysis | Root Cause | Cross-cutting | Multi-method RCA |
| 44 | get_inbox | Workflow | Workflow | User task inbox |
| 45 | complete_task | Workflow | Workflow | Complete workflow task |
| 46 | semantic_search | Search | Cross-cutting | Vector similarity search |
| 47 | full_text_search | Search | Cross-cutting | Elasticsearch query |
| 48 | get_kpis | Analytics | Cross-cutting | KPI metrics |
| 49 | get_trends | Analytics | Cross-cutting | Time-series trends |
| 50 | request_human_approval | Approval | Cross-cutting | Queue for human review |

## C. Glossary

| Term | Definition |
|------|-----------|
| ADK | Agent Development Kit (Google) |
| ALCOA+ | Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available |
| BPMN | Business Process Model and Notation |
| CAPA | Corrective and Preventive Action |
| CDSCO | Central Drugs Standard Control Organization (India) |
| CFR | Code of Federal Regulations (US) |
| FMEA | Failure Mode and Effects Analysis |
| GAMP5 | Good Automated Manufacturing Practice, 5th Edition |
| GxP | Good x Practice (GMP, GLP, GCP, etc.) |
| HNSW | Hierarchical Navigable Small World (vector index algorithm) |
| MCP | Model Context Protocol |
| NC | Nonconformance |
| OFI | Opportunity for Improvement |
| RAG | Retrieval-Augmented Generation |
| RPN | Risk Priority Number (Severity x Occurrence x Detection) |
| SCAR | Supplier Corrective Action Request |
| SOP | Standard Operating Procedure |

---

**Document End**

*Prepared by MechatronLabs AI Architecture Team*
*Version 1.0 | June 2026*
*Classification: Confidential*
```

## 25.3 Tool Permission Model

Every tool call is validated against the user's QMS permissions before execution:

```java
@Component
public class ToolPermissionValidator {

    private final PermissionService permissionService;

    /**
     * Maps tool names to required QMS permissions.
     * AI agents cannot bypass the existing permission model.
     */
    private static final Map<String, Permission> TOOL_PERMISSIONS = Map.of(
        "create_deviation", new Permission("DEVIATION", "CREATE", "deviation"),
        "classify_deviation", new Permission("DEVIATION", "UPDATE", "deviation"),
        "create_capa", new Permission("CAPA", "CREATE", "capa"),
        "approve_deviation", new Permission("DEVIATION", "APPROVE", "deviation"),
        "list_deviations", new Permission("DEVIATION", "READ", "deviation")
    );

    public void validateToolAccess(String toolName, User user) {
        Permission required = TOOL_PERMISSIONS.get(toolName);
        if (required != null && !permissionService.hasPermission(user, required)) {
            throw new ForbiddenException(
                "User lacks permission for tool: " + toolName);
        }
    }
}
```