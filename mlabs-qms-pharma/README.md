AI Agent Integration - Complete Implementation Summary

Backend (mlabs-qms-pharma) - 29 new files

Dependencies Added (pom.xml):
- com.openai:openai-java:2.2.0 - OpenAI Java SDK (GPT-5 Mini)
- com.google.adk:google-adk:0.1.0 - Google ADK framework
- spring-boot-starter-websocket - Real-time AI chat

Database Migration (V24__ai_agent_schema.sql):
- ai_conversations - Chat sessions between user and AI
- ai_messages - Individual messages with role, agent type, tokens
- ai_agent_executions - Tracks every agent invocation with status, latency, tokens
- ai_audit_trail - 21 CFR Part 11 compliant audit logging
- ai_prompt_templates - Versioned, validated prompt templates
- ai_agent_config - Runtime agent configuration (13 agents seeded)
- AI permissions added to all roles

Configuration:
- AiConfig.java - OpenAI client bean (API key from GCP Secret Manager via ${OPENAI_API_KEY})
- WebSocketConfig.java - STOMP WebSocket for real-time chat
- application.yml - AI section with model, temperature, rate limits

Enums: AgentType, ConversationStatus, MessageRole, AgentExecutionStatus

Entities: AiConversation, AiMessage, AiAgentExecution, AiAuditLog, AiPromptTemplate, AiAgentConfig

Repositories: 6 Spring Data JPA repositories with custom queries

Agent Framework (service/ai/agents/):
- BaseAgent - Abstract base with execute pattern, request/response models
- SupervisorAgent - Routes requests to appropriate domain agent via LLM
- CopilotAgent - General-purpose QMS assistant with conversation history
- 11 Domain Agents: CAPA, Deviation, Change Control, Document, Training, Audit, Risk, Complaint, Supplier, NC, Equipment

Core Services (service/ai/):
- OpenAiLlmService - OpenAI client wrapper with chat, history, tool calling
- AgentRegistry - Spring-managed agent discovery and lookup
- AiConversationService - Full conversation lifecycle with supervisor routing
- AiDashboardService - Agent metrics, execution stats, token usage

REST API (AiCopilotController):
- POST /api/v1/ai/chat - Send message, get AI response
- GET /api/v1/ai/conversations - List user conversations
- GET /api/v1/ai/conversations/{id} - Get conversation with messages
- PATCH /api/v1/ai/conversations/{id}/archive - Archive
- DELETE /api/v1/ai/conversations/{id} - Soft delete
- GET /api/v1/ai/dashboard - Agent metrics dashboard
- GET /api/v1/ai/agents - Agent configurations
- PATCH /api/v1/ai/agents/{id}/toggle - Enable/disable agent
- GET /api/v1/ai/audit-trail - AI audit trail

BPMN Process (ai-agent-process.bpmn20.xml):
- AI Agent Approval Process (human-in-the-loop)
- AI-Assisted CAPA Creation Process

Frontend (shell-app) - 3 new files + 2 modified

New Components:
- ai-copilot-panel.component.ts - Floating chat widget (bottom-right FAB)
    - Suggestion chips for quick starts
    - Agent-type badges on responses
    - Conversation history menu
    - Auto-resize textarea, loading animation
    - Module context awareness (auto-detects current module from URL)
- ai-dashboard.component.ts - Full AI monitoring dashboard
    - KPI cards (conversations, messages, executions, latency, tokens)
    - Agent grid with enable/disable toggles
    - Execution distribution bar chart
    - Status breakdown

New Service:
- ai-copilot.service.ts - AI API client with RxJS observables

Modified Files:
- app.routes.ts - Added /ai/dashboard route
- app.component.ts - Added AI menu, copilot panel, route state

Workflow Diagrams (Mermaid) - 6 files in docs/diagrams/

- ai-agent-architecture.mmd - Full system architecture
- ai-chat-flow.mmd - Request processing sequence diagram
- ai-supervisor-routing.mmd - Intelligent request routing flowchart
- ai-approval-workflow.mmd - Human-in-the-loop approval flow
- ai-database-schema.mmd - ER diagram for AI tables
- ai-cross-module-chains.mmd - 5 cross-module automation chains

Configuration

Set these environment variables for deployment:
OPENAI_API_KEY=<your-openai-api-key>  # Or via GCP Secret Manager
AI_MODEL=gpt-5-mini                    # Default model
AI_ENABLED=true                        # Feature flag
-----
---------------------
Implementation Summary

Comparison with Architecture Document

┌──────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬───────────────────────────────┐
│ Document Chapter │                                                              Feature                                                               │            Status             │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 1-5           │ Architecture & Vision                                                                                                              │ Pre-existing                  │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 6             │ Multi-Agent Architecture (13 agents + supervisor)                                                                                  │ Already implemented           │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 7             │ Supervisor Agent & Orchestrator                                                                                                    │ Already implemented           │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 8-18          │ Domain Agent System Prompts (Deviation, CAPA, Complaint, Audit, Document, Training, Supplier, Equipment, NC, Risk, Change Control) │ Already implemented           │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 22            │ AI Copilot Chat UI                                                                                                                 │ Already implemented           │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 34-36         │ ADK Code Architecture, Spring Boot Integration                                                                                     │ Already implemented           │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 40            │ PostgreSQL AI Tables (conversations, messages, executions, audit, configs, prompts)                                                │ Already implemented (V24-V25) │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 42            │ REST API: Chat, Conversations, Dashboard, Agent Config, Audit Trail                                                                │ Already implemented           │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 42            │ REST API: Direct Agent Invocation                                                                                                  │ NEW - Implemented             │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 42            │ REST API: AI Suggestions CRUD                                                                                                      │ NEW - Implemented             │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 42            │ REST API: Agent Tools Listing                                                                                                      │ NEW - Implemented             │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 42            │ REST API: Suggestion Count                                                                                                         │ NEW - Implemented             │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 46            │ AI Audit Trail Immutability (DB Trigger)                                                                                           │ NEW - Implemented             │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 48            │ Human-in-the-Loop Approval Workflow                                                                                                │ NEW - Implemented             │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 48            │ AI Suggestions Table (DDL)                                                                                                         │ NEW - Implemented             │
├──────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Ch 48            │ E-Signature Integration for GxP Decisions                                                                                          │ NEW - Implemented             │
└──────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴───────────────────────────────┘

New Files Created (10)

┌────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┐
│                      File                      │                               Purpose                               │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ V26__ai_suggestions_and_audit_immutability.sql │ Flyway DDL: ai_suggestions table, immutability trigger, permissions │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ AiSuggestion.java                              │ JPA entity for AI suggestions                                       │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ AiSuggestionStatus.java                        │ Enum: PENDING, ACCEPTED, REJECTED, MODIFIED, EXPIRED                │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ AiSuggestionType.java                          │ Enum: 25 suggestion types across all modules                        │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ AiSuggestionRepository.java                    │ Spring Data JPA repository with query methods                       │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ AiSuggestionResponse.java                      │ Response DTO for suggestion API                                     │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ AiSuggestionReviewRequest.java                 │ Request DTO for accept/reject with e-signature                      │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ AiAgentInvokeRequest.java                      │ Request DTO for direct agent invocation                             │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ AiSuggestionService.java                       │ Service: create, review, expire suggestions with audit trail        │
├────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ ai-agentic-workflow-implementation.mmd         │ Mermaid workflow diagram                                            │
└────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────┘

Modified Files (3)

┌──────────────────────────┬────────────────────────────────────────────────────────────────────────────┐
│           File           │                                  Changes                                   │
├──────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ AiCopilotController.java │ +7 new endpoints: agent invoke, tools, suggestions CRUD, suggestion counts │
├──────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ AiDashboardResponse.java │ +4 fields: suggestion metrics                                              │
├──────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ AiDashboardService.java  │ Integrated suggestion stats into dashboard                                 │
└──────────────────────────┴────────────────────────────────────────────────────────────────────────────┘

New REST API Endpoints

┌────────┬──────────────────────────────────────┬────────────────────────────────────────────────┐
│ Method │                 Path                 │                  Description                   │
├────────┼──────────────────────────────────────┼────────────────────────────────────────────────┤
│ POST   │ /api/v1/ai/agents/{agentName}/invoke │ Direct agent invocation (bypass supervisor)    │
├────────┼──────────────────────────────────────┼────────────────────────────────────────────────┤
│ GET    │ /api/v1/ai/agents/{agentName}/tools  │ List tools available to an agent               │
├────────┼──────────────────────────────────────┼────────────────────────────────────────────────┤
│ GET    │ /api/v1/ai/suggestions               │ List AI suggestions (filterable)               │
├────────┼──────────────────────────────────────┼────────────────────────────────────────────────┤
│ GET    │ /api/v1/ai/suggestions/{id}          │ Get suggestion detail                          │
├────────┼──────────────────────────────────────┼────────────────────────────────────────────────┤
│ PUT    │ /api/v1/ai/suggestions/{id}/review   │ Accept/reject/modify with optional e-signature │
├────────┼──────────────────────────────────────┼────────────────────────────────────────────────┤
│ GET    │ /api/v1/ai/suggestions/count         │ Pending suggestion counts                      │
└────────┴──────────────────────────────────────┴────────────────────────────────────────────────┘

Database Changes (V26)

- ai_suggestions table with 5 indexes for status, module, agent, assignment, and expiry
- Immutability trigger on ai_audit_trail (prevents modification/deletion of core fields for 21 CFR Part 11)
- New permission: AI.REVIEW.ai_suggestions granted to QA roles

Mermaid Diagram

The workflow diagram at docs/diagrams/ai-agentic-workflow-implementation.mmd shows:
- All 6 presentation layer MFEs + AI Copilot panel
- 7 REST API endpoints
- Supervisor routing to 11 domain agents + 4 cross-cutting agents
- 5 service layer components
- Human-in-the-loop approval flow (PENDING -> REVIEW -> ACCEPT/REJECT/MODIFY -> AUDIT)
- 8 cross-module agent chains (Deviation->CAPA, Complaint->CAPA, etc.)
- All 7 AI database tables
- External service integrations (OpenAI, GCS)
--------

Completed Changes

1. QmsToolExecutor (service/ai/QmsToolExecutor.java) — Central tool execution service
- Maps 35+ tool names to actual JPA repository queries across all 11 QMS modules
- executeTool() — executes any named tool and returns JSON
- getToolsForAgent() — returns tool definitions per agent type
- Tools: search_*, get_*_by_number, count_*_by_status, count_*_overdue, get_qms_summary

2. OpenAI Tool Calling Loop (service/ai/OpenAiLlmService.java)
- chatWithTools() — implements the full function calling loop (up to 5 rounds)
- LLM requests tool → execute via QmsToolExecutor → return results → LLM generates answer with real data

3. BaseAgent (service/ai/agents/BaseAgent.java)
- Now accepts QmsToolExecutor and automatically uses tools when available
- Falls back to simple chat for agents without tools

4. All 13 Agent System Prompts Updated
- Every agent now has IMPORTANT: You have DIRECT ACCESS to the QMS database via tools instruction
- Lists specific tool names available to each agent
- Instructs agents to never claim they lack database access
- Adds human approval requirement for record modifications

How it works (end-to-end flow)

User: "Show me open CAPAs"
→ Supervisor routes to CAPA_AGENT
→ CAPA Agent calls OpenAI with tool definitions (search_capas, get_capa_by_number, etc.)
→ OpenAI responds with tool_call: search_capas({status: "INITIATED"})
→ QmsToolExecutor.executeTool("search_capas", args) → queries CapaRepository → returns JSON
→ JSON sent back to OpenAI as tool result
→ OpenAI generates final response with real CAPA data from the database

The system should now return real database results instead of "I don't have database access." Restart the Spring Boot app and try clicking "Open CAPAs" again.

------

