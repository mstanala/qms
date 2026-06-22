
Need to create Angular QMS application for Pharma company's Quality Management System (QMS) to build a specialized, AI-enabled QMS solution for small and mid-sized pharmaceutical manufacturers, CDMOs, and nutraceutical companies in India and emerging markets.

For MVP1 we can focus on CAPA Management Platform.

You can consider screens or UI designs from existing Pharma QMS systems like Veeva, MasterControl, or QAD as reference points, but this product should be tailored for the Indian market and emerging markets.
QMS-Pharma has Angular microfrontend architecture, shell-app and rest all remote apps like capa,change-control,deviation etc..

please suggest how many backend api's needed for this CAPA Management Platform.
Please also suggest database tables needed for this CAPA Management Platform.
If possible pls prepare DDL scripts for Postgres database tables.

Tech stack for this product:
* Front end: Angular 18
* APIs: Java Spring Boot 3.5
* Database: PostgreSQL 17
* Workflow engine: Flowable (latest available version)
* Search: OpenSearch (latest available version)
* Document storage: Google cloudstorage (latest available version)
* Identity: OAuth 2.0 and SAML (latest available version)

Below Details for Pharma QMS CAPA management/FDA Audit Domain knowledge:

* Pre-validated workflows
* Built-in compliance controls
* AI-assisted quality investigations
* Faster implementation for Indian pharma companies

Think of the product as a regulated business platform, not a traditional software application.

Focus on a painful problem that is still managed with spreadsheets, email, and paper.

High-value standalone Pharma QMS products

1. CAPA Management Platform (Highest potential)

CAPA = Corrective and Preventive Actions

This is one of the most audited and operationally difficult QMS processes.

Core features:

* Deviation tracking
* Root cause analysis
* CAPA workflow automation
* Effectiveness verification
* Escalations and reminders
* Regulatory audit trails

AI capabilities:

* Suggest root causes from historical incidents
* Recommend preventive actions
* Identify recurring quality issues

-----*******************------

Why Hyderabad/India Pharma is the Right Beachhead
Telangana and Andhra Pradesh together host one of the densest pharma manufacturing clusters in the world — Genome Valley in Hyderabad, the API corridor from Hyderabad to Visakhapatnam, and hundreds of mid-size plants in between. The numbers tell the story:
India has approximately 10,500 licensed pharma manufacturing units nationally. Of those, roughly 600+ are FDA-approved, 2,000+ are EU-GMP certified, and 3,000–4,000 hold WHO-GMP certification. The rest — the long tail of small manufacturers, CDMOs, and nutraceutical companies — are scrambling to upgrade under Revised Schedule M, India's overhauled GMP regulation that became mandatory in late 2024. This regulation upgrade is your tailwind. Every small and mid-size pharma company in India right now is under pressure to formalize their quality systems. Most of them are still on Excel and paper.
Hyderabad alone gives you proximity to companies like Aurobindo, Hetero, Divi's, Shilpa Medicare, Suven, and dozens of contract manufacturers. You don't need to win them — you need to win their vendors, their subsidiaries, and companies of their size who can't afford enterprise QMS but face the same regulatory scrutiny.

The CAPA Market Reality
CAPA is the right starting point, and here's the data to back that up. It is consistently the #1 or #2 most cited deficiency in FDA 483 observations issued to Indian pharma plants. FDA warning letters to Indian manufacturers frequently cite "failure to establish and follow written procedures for the investigation of quality failures" and "inadequate CAPA systems." A single FDA Warning Letter can cost a company ₹10–50Cr in remediation, lost exports, and plant downtime.
This means your buyer has a compliance crisis motivation, not just an efficiency motivation. That's a much stronger purchase trigger. A QA Head who signs off on spreadsheet-based CAPA is personally liable when the FDA auditor walks in. Your software gives them a defensible, audit-ready system — and that's worth real money.

Competitive Landscape: The Gap You're Targeting
Enterprise players — Veeva Vault QMS, MasterControl, ETQ Reliance, TrackWise — charge $50,000 to $200,000+ per year. A 200-person pharma company in Narsapur cannot afford that, cannot implement it without consultants, and doesn't need 80% of the features.
Global mid-market players — Qualio, Dot Compliance, SimplerQMS — are SaaS-first and more affordable ($10,000–$40,000/year), but they're built for Western markets. They don't understand CDSCO workflows, Schedule M documentation requirements, or Indian audit terminology. They have no India sales presence.
Indian players — there are a handful of local QMS tools, but none that are AI-first, none with modern UX, and most are on-premise legacy software from 10–15 years ago. This is where you have a genuine opening: an AI-native, India-regulatory-aware, cloud-based CAPA platform priced for Indian SMEs.

Revenue Potential: Is the Math Good?
Here's a realistic model:
A small pharma company (50–300 employees) would pay ₹3–8 lakhs per year for a credible, validated QMS SaaS. A mid-size company (300–1,000 employees) would pay ₹8–20 lakhs. Add a one-time implementation and Computer System Validation (CSV) support fee of ₹1–3 lakhs per client.
If you close just 20 clients in Year 1 at an average of ₹5L/year, that's ₹1 Crore ARR. By Year 3, 100 clients at ₹6L average = ₹6 Crore ARR. That's a fundable, scalable business — and those numbers are conservative given the addressable pool of 2,000–5,000 target companies in India alone.
Emerging markets (Bangladesh, Indonesia, Vietnam, Kenya, South Africa) have growing generic pharma sectors with the same regulatory upgrade pressure and no local QMS vendors at all. That's your expansion layer after India.

The Critical Risks You Must Plan For
1. Validation burden on you, not just them

Your software itself must be validated per 21 CFR Part 11 (for US market access) and GAMP 5 guidelines (for EU). This means maintaining an IQ/OQ/PQ validation pack, change control documentation for every software update, and audit trail requirements baked deep into your architecture. This is non-negotiable for regulated pharma clients and it takes time and expertise to get right. Budget 3–4 months for this before your first paid pharma customer.
2. Long, trust-driven sales cycles

Pharma QA Managers are conservative. They are not going to switch their quality system quickly. Expect 3–6 month sales cycles for your first few clients. The mitigation: start with a free or low-cost pilot for 1–2 companies near Narsapur. Let them run CAPA on your system for 60 days. One reference customer in pharma is worth 50 cold emails.
3. You need a domain expert co-founder or advisor

The AI and software you can build. But the product decisions — which fields on a CAPA form, how deviation classification maps to Schedule M, what an FDA auditor actually looks for — require a former pharma QA Head or Regulatory Affairs professional as an advisor or early hire. This is the most common failure point for tech-first pharma software companies. The good news: Hyderabad has hundreds of these people, many consulting independently.
4. Data hosting and security

Pharma companies will ask where their data is stored. You'll need to be explicit about India data residency (DPDP Act compliance), with the option for US-hosted instances for FDA-registered plants. Plan this into your infrastructure from day one.

Product Roadmap Recommendation
Don't try to build a full QMS on Day 1. The right sequence is:
Phase 1 (Months 1–6): CAPA as a standalone product

Build just the CAPA module — deviation tracking, root cause analysis with AI suggestions, workflow automation, effectiveness verification, full audit trail, and regulatory reports. Validate it per 21 CFR Part 11. Onboard 3–5 pilot clients in Telangana for free or at cost. Collect feedback aggressively.
Phase 2 (Months 7–12): Add Document Control

Document Control (SOPs, master batch records, controlled documents) is the second-most-cited FDA deficiency and the most natural add-on. Clients who trust your CAPA module will adopt Document Control immediately.
Phase 3 (Year 2): Expand to full QMS

Add Change Control, Supplier Quality Management, Training Records, and Equipment Calibration modules. By now you have reference customers, real usage data, and the AI models are trained on actual pharma incidents.
Phase 4: Emerging markets

Localize for Bangladesh, Indonesia, Kenya. Partner with local QA consultants as channel partners — they bring clients; you give them a percentage.

Go-to-Market: How to Get First Customers
Your best channels, in order:
QA Consultants as channel partners — there are hundreds of independent pharma QA consultants in Hyderabad who audit small manufacturers and help them prepare for FDA/WHO inspections. If you give them a referral fee (15–20% of first year ACV) and make them look good to their clients, they become your sales force overnight. This is the fastest path to 10 clients.
Industry associations — IDMA (Indian Drug Manufacturers Association), BDMA (Bulk Drug Manufacturers Association), and the Telangana Pharma industry forums. Sponsor their events. Present a session on "AI-enabled CAPA for Schedule M compliance." The buyers are in the room.
LinkedIn — target QA Heads, VP Quality, Regulatory Affairs Managers at pharma companies in Telangana and AP. A 30-day LinkedIn outreach campaign with a clear value proposition ("Replace your CAPA spreadsheets before your next audit") will surface interested prospects.
Walk in the door — you are literally based near pharma plants. Cold visits to QA departments with a 20-minute demo are surprisingly effective in this industry. The face-to-face trust matters enormously in pharma.

Bottom Line
This is a strong business idea with real market pull, a clear gap in the competitive landscape, and a geographic advantage that most founders would pay for. The risks are manageable if you solve the validation question early and bring in pharma domain expertise.
One thing I'd strongly suggest: before writing a line of code, spend 4 weeks interviewing 20 QA Heads at pharma companies in your area. Ask them what their CAPA process looks like today, what went wrong in their last audit, and what they'd pay to fix it. Those conversations will shape your product more than any market research report — and they'll warm up your first 5 customers at the same time.
What's your current thinking on the domain expertise side — do you have any pharma QA advisors or connections in the industry already?

-------


-------


For a pharma QMS, almost every quality process is a workflow:

* Deviation management
* CAPA
* Change control
* Document approval
* Training assignments
* Audit findings
* Supplier qualification

Instead of hard-coding each process into your application, a workflow engine allows you to define, modify, monitor, and automate workflows without changing application code.

Example: CAPA workflow

A typical CAPA process might look like this:

1. Quality engineer creates a CAPA record
2. Quality manager reviews and assigns an owner
3. Investigation team performs root cause analysis
4. Corrective actions are approved
5. Preventive actions are implemented
6. Effectiveness is verified
7. CAPA is closed

A workflow engine manages:

* Who performs each task
* Approval rules
* Escalations
* Due dates
* Notifications
* Electronic signatures
* Audit trails

⸻

Why a workflow engine matters in pharma

Pharma companies frequently change processes because of:

* New FDA observations
* Internal SOP updates
* Customer requirements
* Regulatory changes

Without a workflow engine, every change requires software development and revalidation.

With a workflow engine, authorized administrators can update workflows through configuration.
What is BPMN?

Both Camunda and Flowable use the industry-standard notation called:

Business Process Model and Notation (BPMN 2.0)

BPMN uses visual diagrams instead of code.

Example:
Deviation Report
↓
Initial Review
↓
Risk Assessment
┌────┴────┐
High Risk?  No
│          │
Investigation Close
│
CAPA Required?
│
└────→ CAPA Workflow
Business users can understand and review these diagrams during audits.

Which should Mechatron Labs choose?

Choose Camunda if:

* You want strong enterprise adoption
* You expect large pharma customers
* You need advanced process monitoring
* You have budget for enterprise licensing

Choose Flowable if:

* You want full control over the platform
* You prefer open-source technologies
* You need lower operating costs
* You plan to embed workflows deeply into your product

For an India-focused SaaS QMS startup, Flowable is often the better starting point.

⸻

Example architecture for your Pharma QMS
Web Application (Angular)

        ↓

Java Spring Boot APIs

        ↓

Flowable Workflow Engine

        ↓

PostgreSQL + Document Storage
In this architecture:

* Your application handles business logic and user interfaces.
* The workflow engine manages process execution.
* The database stores records and audit trails.

⸻

Why workflow engines help during FDA audits

Auditors often ask:

* Who approved this CAPA?
* When was it approved?
* Was any step skipped?
* Which SOP version was used?
* Why was the deviation closed?

A workflow engine automatically maintains:

* Complete audit histories
* Timestamps
* User actions
* Approval sequences
* Electronic signature records

These capabilities are essential for compliance with:

* 21 CFR Part 11
* EU GMP Annex 11
* ALCOA+ data integrity principles

For a pharma QMS product, the workflow engine is not an optional feature—it is the foundation of the entire platform.

5. Typical Deviation Workflow

Step 1: Event Identification

Any employee identifies:

* Out-of-specification result
* SOP non-compliance
* Equipment malfunction
* Process failure

The user creates a Deviation record.

Performed by: Operator, Technician, Analyst

⸻

Step 2: Initial Triage

QA evaluates:

* Severity
* Impact
* Product risk
* Need for immediate action

Performed by: QA Specialist

⸻

Step 3: Investigation

Investigation activities include:

* Data collection
* Root cause analysis
* Interviews
* Attachments and evidence

Methods commonly used:

* 5 Whys
* Fishbone Diagram
* Fault Tree Analysis

Performed by: Investigator or SME

⸻

Step 4: QA Review

QA reviews investigation results.

Decision:

* Close deviation
* Initiate CAPA
* Initiate Change Control

Performed by: QA Manager
------------------------------
FLOWABLE:
Common Pharma QMS Processes Managed by Flowable
Process

Typical Activities

Deviation Management

Logging, investigation, approvals, closure

CAPA

Action assignment, implementation, effectiveness checks

Change Control

Impact assessment, approvals, validation

Audit Management

Findings, action tracking, closure

Complaint Handling

Intake, investigation, regulatory reporting

Supplier Quality

Qualification, audits, monitoring

Training Management

Training assignment and completion tracking

Document Control

Review, approval, periodic review
------

1. ChangeRequestService.java — Flowable integration
- Added PROCESS_KEY and RECORD_TYPE constants
- create() now starts changeControlProcess Flowable process with variables (recordId, changeNumber, changeOwnerId, classification, regulatoryFilingRequired, etc.) and stores flowableProcessId
- transitionStatus() now completes the correct Flowable user task for each status transition:
    - SUBMITTED → completes submitChange task
    - QA_REVIEW → completes impactAssessment task
    - RA_REVIEW → completes qaReview with regulatoryFilingRequired=true
    - PENDING_APPROVAL → completes raReview or qaReview depending on current status
    - APPROVED/IMPLEMENTATION → completes pendingApproval with approvalDecision=APPROVED
    - REJECTED → completes current task with approvalDecision=REJECTED
    - VERIFICATION → completes implementation task
    - EFFECTIVENESS_CHECK → completes verification task
    - CLOSED → completes effectivenessCheck task
- Added getWorkflowHistory() method
- Each transition records dual workflow history steps

2. CapaController.java — New endpoints added
- POST /{id}/start-action-execution — transitions from Action Planning to Execution
- POST /{id}/complete-action-execution — completes action execution phase
- GET /{id}/workflow-history — returns workflow history

3. ChangeRequestController.java — New endpoint added
- GET /{id}/workflow-history — returns workflow history

4. TaskInboxService.java + TaskInboxController.java — Created
- GET /api/v1/tasks/inbox — returns all tasks for the current user (by assignee + candidate groups)
- GET /api/v1/tasks/inbox/count — returns task count for badge display
- GET /api/v1/tasks/by-record-type/{recordType} — filter tasks by DEVIATION/CAPA/CHANGE_CONTROL
- POST /api/v1/tasks/{taskId}/claim — claim a candidate group task
- POST /api/v1/tasks/{taskId}/unclaim — release a claimed task
- Each task response includes recordType, recordId, recordNumber for Angular to link to the right record

5. Bug fixes from previous session
- Added assignedToId field to ClassifyDeviationRequest
- Added capaRequired field to SubmitDispositionRequest
- Fixed broken assign() in DeviationService (was using invalid BeanFactoryUtils call, now uses workflowService.updateProcessVariable())
- Added updateProcessVariable() method to WorkflowService

6. TaskInboxResponse DTO — Created with taskId, taskName, recordType, recordId, recordNumber, assignee, createTime, dueDate, formKey, priority


