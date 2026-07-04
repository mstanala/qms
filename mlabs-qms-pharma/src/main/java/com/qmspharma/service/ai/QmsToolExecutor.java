package com.qmspharma.service.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qmspharma.model.enums.AgentType;
import com.qmspharma.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Executes QMS database tool calls requested by AI agents.
 * Maps tool names to actual repository/service queries and returns
 * JSON-serializable results that get fed back to the LLM.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QmsToolExecutor {

    private final ObjectMapper objectMapper;

    // Repositories - injected by Spring
    private final CapaRepository capaRepository;
    private final DeviationRepository deviationRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final ComplaintRepository complaintRepository;
    private final AuditRepository auditRepository;
    private final DocumentRepository documentRepository;
    private final TrainingAssignmentRepository trainingAssignmentRepository;
    private final SupplierRepository supplierRepository;
    private final NonconformanceRepository nonconformanceRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final EquipmentRepository equipmentRepository;

    /**
     * Execute a tool call and return JSON string result.
     */
    public String executeTool(String toolName, String argumentsJson) {
        try {
            Map<String, Object> args = parseArgs(argumentsJson);
            Object result = switch (toolName) {
                // ─── CAPA Tools ───
                case "search_capas" -> searchCapas(args);
                case "get_capa_by_number" -> getCapaByNumber(args);
                case "count_capas_by_status" -> countCapasByStatus();
                case "count_capas_overdue" -> Map.of("overdueCount", capaRepository.countOverdue());

                // ─── Deviation Tools ───
                case "search_deviations" -> searchDeviations(args);
                case "get_deviation_by_number" -> getDeviationByNumber(args);
                case "count_deviations_by_status" -> countDeviationsByStatus();
                case "count_deviations_overdue" -> Map.of("overdueCount", deviationRepository.countOverdue());

                // ─── Change Control Tools ───
                case "search_change_requests" -> searchChangeRequests(args);
                case "get_change_request_by_number" -> getChangeRequestByNumber(args);
                case "count_change_requests_by_status" -> countChangeRequestsByStatus();

                // ─── Complaint Tools ───
                case "search_complaints" -> searchComplaints(args);
                case "get_complaint_by_number" -> getComplaintByNumber(args);
                case "count_complaints_by_status" -> countComplaintsByStatus();

                // ─── Audit Tools ───
                case "search_audits" -> searchAudits(args);
                case "count_audits_by_status" -> countAuditsByStatus();

                // ─── Document Tools ───
                case "search_documents" -> searchDocuments(args);
                case "count_documents_by_status" -> countDocumentsByStatus();

                // ─── Training Tools ───
                case "search_training_assignments" -> searchTrainingAssignments(args);
                case "count_training_by_status" -> countTrainingByStatus();

                // ─── Supplier Tools ───
                case "search_suppliers" -> searchSuppliers(args);
                case "count_suppliers_by_status" -> countSuppliersByStatus();

                // ─── Nonconformance Tools ───
                case "search_nonconformances" -> searchNonconformances(args);
                case "count_nonconformances_by_status" -> countNonconformancesByStatus();

                // ─── Risk Tools ───
                case "search_risk_assessments" -> searchRiskAssessments(args);
                case "count_risks_by_status" -> countRisksByStatus();

                // ─── Equipment Tools ───
                case "search_equipment" -> searchEquipment(args);
                case "count_equipment_by_status" -> countEquipmentByStatus();

                // ─── Cross-Module Tools ───
                case "get_qms_summary" -> getQmsSummary();

                default -> Map.of("error", "Unknown tool: " + toolName);
            };
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            log.error("Tool execution failed: {} - {}", toolName, e.getMessage(), e);
            return "{\"error\": \"Tool execution failed: " + e.getMessage().replace("\"", "'") + "\"}";
        }
    }

    /**
     * Returns the list of tool definitions applicable for a given agent type.
     */
    public List<OpenAiLlmService.ToolDefinition> getToolsForAgent(AgentType agentType) {
        return switch (agentType) {
            case CAPA_AGENT -> List.of(
                    tool("search_capas", "Search CAPAs by status, priority, type, source type, or keyword. Returns matching CAPA records with number, title, status, priority, type, source, owner, dates.",
                            Map.of("status", prop("string", "Filter by status: INITIATED, UNDER_REVIEW, INVESTIGATION, ROOT_CAUSE_IDENTIFIED, ACTION_PLANNING, ACTION_IN_PROGRESS, EFFECTIVENESS_CHECK, PENDING_CLOSURE, CLOSED, REJECTED"),
                                    "priority", prop("string", "Filter by priority: CRITICAL, HIGH, MEDIUM, LOW"),
                                    "type", prop("string", "Filter by type: CORRECTIVE, PREVENTIVE"),
                                    "sourceType", prop("string", "Filter by source: DEVIATION, AUDIT_FINDING, CUSTOMER_COMPLAINT, INTERNAL_OBSERVATION"),
                                    "search", prop("string", "Keyword search in title and CAPA number"),
                                    "limit", prop("integer", "Max results to return (default 20)"))),
                    tool("get_capa_by_number", "Get detailed CAPA record by its number (e.g., CAPA-2024-001)",
                            Map.of("capaNumber", prop("string", "The CAPA number, e.g. CAPA-2024-001"))),
                    tool("count_capas_by_status", "Get count of CAPAs grouped by status for dashboard overview", Map.of()),
                    tool("count_capas_overdue", "Get count of overdue CAPAs (past target completion date and not closed)", Map.of())
            );
            case DEVIATION_AGENT -> List.of(
                    tool("search_deviations", "Search deviations by status, classification, category, or keyword. Returns matching deviation records.",
                            Map.of("status", prop("string", "Filter by status: REPORTED, UNDER_REVIEW, CLASSIFIED, INVESTIGATION, IMPACT_ASSESSMENT, DISPOSITION, CAPA_INITIATED, PENDING_CLOSURE, CLOSED, REJECTED"),
                                    "classification", prop("string", "Filter by classification: CRITICAL, MAJOR, MINOR"),
                                    "category", prop("string", "Filter by category"),
                                    "search", prop("string", "Keyword search in title and deviation number"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("get_deviation_by_number", "Get detailed deviation record by number (e.g., DEV-2024-001)",
                            Map.of("deviationNumber", prop("string", "The deviation number"))),
                    tool("count_deviations_by_status", "Get count of deviations grouped by status", Map.of()),
                    tool("count_deviations_overdue", "Get count of overdue deviations", Map.of())
            );
            case CHANGE_CONTROL_AGENT -> List.of(
                    tool("search_change_requests", "Search change requests by status, classification, type, priority, or keyword.",
                            Map.of("status", prop("string", "Filter by status: DRAFT, SUBMITTED, IMPACT_ASSESSMENT, QA_REVIEW, RA_REVIEW, PENDING_APPROVAL, APPROVED, IMPLEMENTATION, VERIFICATION, EFFECTIVENESS_CHECK, CLOSED, REJECTED, WITHDRAWN"),
                                    "classification", prop("string", "Filter: COSMETIC, MINOR, MAJOR, CRITICAL"),
                                    "type", prop("string", "Filter: EQUIPMENT, MATERIAL, PROCESS, FACILITY, PROCEDURE, VALIDATION, SOFTWARE, OTHER"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("get_change_request_by_number", "Get change request by number",
                            Map.of("changeNumber", prop("string", "The change request number"))),
                    tool("count_change_requests_by_status", "Get count of change requests grouped by status", Map.of())
            );
            case COMPLAINT_AGENT -> List.of(
                    tool("search_complaints", "Search complaints by status, type, or keyword.",
                            Map.of("status", prop("string", "Filter by complaint status"),
                                    "complaintType", prop("string", "Filter by complaint type"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("get_complaint_by_number", "Get complaint by number",
                            Map.of("complaintNumber", prop("string", "The complaint number"))),
                    tool("count_complaints_by_status", "Get count grouped by status", Map.of())
            );
            case AUDIT_AGENT -> List.of(
                    tool("search_audits", "Search audits by status, type, or keyword.",
                            Map.of("status", prop("string", "Filter by audit status"),
                                    "auditType", prop("string", "Filter by audit type"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("count_audits_by_status", "Get count of audits grouped by status", Map.of())
            );
            case DOCUMENT_AGENT -> List.of(
                    tool("search_documents", "Search documents by status, type, or keyword.",
                            Map.of("status", prop("string", "Filter by document status"),
                                    "documentType", prop("string", "Filter by document type"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("count_documents_by_status", "Get count of documents grouped by status", Map.of())
            );
            case TRAINING_AGENT -> List.of(
                    tool("search_training_assignments", "Search training assignments by status or keyword.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("count_training_by_status", "Get count of training assignments grouped by status", Map.of())
            );
            case SUPPLIER_AGENT -> List.of(
                    tool("search_suppliers", "Search suppliers by status, type, or keyword.",
                            Map.of("status", prop("string", "Filter by supplier status"),
                                    "supplierType", prop("string", "Filter by type"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("count_suppliers_by_status", "Get count of suppliers grouped by status", Map.of())
            );
            case NC_AGENT -> List.of(
                    tool("search_nonconformances", "Search nonconformances by status, type, or keyword.",
                            Map.of("status", prop("string", "Filter by NC status"),
                                    "ncType", prop("string", "Filter by NC type"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("count_nonconformances_by_status", "Get count of NCs grouped by status", Map.of())
            );
            case RISK_AGENT -> List.of(
                    tool("search_risk_assessments", "Search risk assessments by status or keyword.",
                            Map.of("status", prop("string", "Filter by risk status"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("count_risks_by_status", "Get count of risk assessments grouped by status", Map.of())
            );
            case EQUIPMENT_AGENT -> List.of(
                    tool("search_equipment", "Search equipment by status, type, or keyword.",
                            Map.of("status", prop("string", "Filter by equipment status"),
                                    "equipmentType", prop("string", "Filter by type"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("count_equipment_by_status", "Get count of equipment grouped by status", Map.of())
            );
            case SUPERVISOR, COPILOT -> List.of(
                    tool("get_qms_summary", "Get a high-level summary of the entire QMS system: counts of open CAPAs, deviations, complaints, audits, change requests, training assignments, and more.", Map.of()),
                    tool("search_capas", "Search CAPAs by status, priority, type, or keyword.",
                            Map.of("status", prop("string", "Filter by CAPA status"),
                                    "priority", prop("string", "Filter by priority"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_deviations", "Search deviations by status, classification, or keyword.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "classification", prop("string", "Filter by classification"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_change_requests", "Search change requests by status or keyword.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_complaints", "Search complaints by status or keyword.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_documents", "Search documents by status, type, or keyword.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_audits", "Search audits by status or keyword.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_suppliers", "Search suppliers by status or keyword.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_nonconformances", "Search nonconformances by status or keyword.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_equipment", "Search equipment by status or keyword.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "search", prop("string", "Keyword search"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_training_assignments", "Search training assignments by status.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "limit", prop("integer", "Max results (default 20)"))),
                    tool("search_risk_assessments", "Search risk assessments by status.",
                            Map.of("status", prop("string", "Filter by status"),
                                    "limit", prop("integer", "Max results (default 20)")))
            );
            default -> List.of(
                    tool("get_qms_summary", "Get QMS system summary with counts across all modules.", Map.of())
            );
        };
    }

    // ────────────────────────────────────────────────────────────────
    // Tool Implementations
    // ────────────────────────────────────────────────────────────────

    private Object searchCapas(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = capaRepository.findAll(pageable);
        return page.getContent().stream().map(c -> Map.of(
                "id", c.getId().toString(),
                "capaNumber", nullSafe(c.getCapaNumber()),
                "title", nullSafe(c.getTitle()),
                "status", nullSafe(c.getStatus()),
                "priority", nullSafe(c.getPriority()),
                "type", nullSafe(c.getType()),
                "sourceType", nullSafe(c.getSourceType()),
                "createdAt", nullSafe(c.getCreatedAt()),
                "targetCompletionDate", nullSafe(c.getTargetCompletionDate())
        )).toList();
    }

    private Object getCapaByNumber(Map<String, Object> args) {
        String number = str(args, "capaNumber");
        return capaRepository.findByCapaNumber(number)
                .map(c -> Map.of(
                        "id", c.getId().toString(),
                        "capaNumber", nullSafe(c.getCapaNumber()),
                        "title", nullSafe(c.getTitle()),
                        "description", nullSafe(c.getDescription()),
                        "status", nullSafe(c.getStatus()),
                        "priority", nullSafe(c.getPriority()),
                        "type", nullSafe(c.getType()),
                        "sourceType", nullSafe(c.getSourceType()),
                        "createdAt", nullSafe(c.getCreatedAt()),
                        "targetCompletionDate", nullSafe(c.getTargetCompletionDate())
                ))
                .orElse(Map.of("error", "CAPA not found: " + number));
    }

    private Object countCapasByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : capaRepository.countByStatusGrouped()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", capaRepository.count());
    }

    private Object searchDeviations(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = deviationRepository.findAll(pageable);
        return page.getContent().stream().map(d -> Map.of(
                "id", d.getId().toString(),
                "deviationNumber", nullSafe(d.getDeviationNumber()),
                "title", nullSafe(d.getTitle()),
                "status", nullSafe(d.getStatus()),
                "classification", nullSafe(d.getClassification()),
                "category", nullSafe(d.getCategory()),
                "createdAt", nullSafe(d.getCreatedAt())
        )).toList();
    }

    private Object getDeviationByNumber(Map<String, Object> args) {
        String number = str(args, "deviationNumber");
        return deviationRepository.findByDeviationNumber(number)
                .map(d -> Map.of(
                        "id", d.getId().toString(),
                        "deviationNumber", nullSafe(d.getDeviationNumber()),
                        "title", nullSafe(d.getTitle()),
                        "description", nullSafe(d.getDescription()),
                        "status", nullSafe(d.getStatus()),
                        "classification", nullSafe(d.getClassification()),
                        "category", nullSafe(d.getCategory()),
                        "createdAt", nullSafe(d.getCreatedAt())
                ))
                .orElse(Map.of("error", "Deviation not found: " + number));
    }

    private Object countDeviationsByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : deviationRepository.countByStatusGrouped()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", deviationRepository.count());
    }

    private Object searchChangeRequests(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = changeRequestRepository.findAll(pageable);
        return page.getContent().stream().map(cr -> Map.of(
                "id", cr.getId().toString(),
                "changeNumber", nullSafe(cr.getChangeNumber()),
                "title", nullSafe(cr.getTitle()),
                "status", nullSafe(cr.getStatus()),
                "classification", nullSafe(cr.getClassification()),
                "type", nullSafe(cr.getType()),
                "priority", nullSafe(cr.getPriority()),
                "createdAt", nullSafe(cr.getCreatedAt())
        )).toList();
    }

    private Object getChangeRequestByNumber(Map<String, Object> args) {
        String number = str(args, "changeNumber");
        return changeRequestRepository.findByChangeNumber(number)
                .map(cr -> Map.of(
                        "id", cr.getId().toString(),
                        "changeNumber", nullSafe(cr.getChangeNumber()),
                        "title", nullSafe(cr.getTitle()),
                        "description", nullSafe(cr.getDescription()),
                        "status", nullSafe(cr.getStatus()),
                        "type", nullSafe(cr.getType()),
                        "classification", nullSafe(cr.getClassification()),
                        "priority", nullSafe(cr.getPriority()),
                        "createdAt", nullSafe(cr.getCreatedAt())
                ))
                .orElse(Map.of("error", "Change request not found: " + number));
    }

    private Object countChangeRequestsByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : changeRequestRepository.countByStatusGrouped()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", changeRequestRepository.count());
    }

    private Object searchComplaints(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = complaintRepository.findAll(pageable);
        return page.getContent().stream().map(c -> Map.of(
                "id", c.getId().toString(),
                "complaintNumber", nullSafe(c.getComplaintNumber()),
                "title", nullSafe(c.getTitle()),
                "status", nullSafe(c.getStatus()),
                "complaintType", nullSafe(c.getComplaintType()),
                "createdAt", nullSafe(c.getCreatedAt())
        )).toList();
    }

    private Object getComplaintByNumber(Map<String, Object> args) {
        String number = str(args, "complaintNumber");
        return complaintRepository.findByComplaintNumber(number)
                .map(c -> Map.of(
                        "id", c.getId().toString(),
                        "complaintNumber", nullSafe(c.getComplaintNumber()),
                        "title", nullSafe(c.getTitle()),
                        "description", nullSafe(c.getDescription()),
                        "status", nullSafe(c.getStatus()),
                        "createdAt", nullSafe(c.getCreatedAt())
                ))
                .orElse(Map.of("error", "Complaint not found: " + number));
    }

    private Object countComplaintsByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : complaintRepository.countByStatusGrouped()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", complaintRepository.count());
    }

    private Object searchAudits(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = auditRepository.findAll(pageable);
        return page.getContent().stream().map(a -> Map.of(
                "id", a.getId().toString(),
                "auditNumber", nullSafe(a.getAuditNumber()),
                "title", nullSafe(a.getTitle()),
                "status", nullSafe(a.getStatus()),
                "auditType", nullSafe(a.getAuditType()),
                "createdAt", nullSafe(a.getCreatedAt())
        )).toList();
    }

    private Object countAuditsByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : auditRepository.countByStatusGrouped()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", auditRepository.count());
    }

    private Object searchDocuments(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = documentRepository.findAll(pageable);
        return page.getContent().stream().map(d -> Map.of(
                "id", d.getId().toString(),
                "documentNumber", nullSafe(d.getDocumentNumber()),
                "title", nullSafe(d.getTitle()),
                "status", nullSafe(d.getStatus()),
                "documentType", nullSafe(d.getDocumentType()),
                "createdAt", nullSafe(d.getCreatedAt())
        )).toList();
    }

    private Object countDocumentsByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : documentRepository.countByStatus()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", documentRepository.count());
    }

    private Object searchTrainingAssignments(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = trainingAssignmentRepository.findAll(pageable);
        return page.getContent().stream().map(t -> Map.of(
                "id", t.getId().toString(),
                "status", nullSafe(t.getStatus()),
                "createdAt", nullSafe(t.getCreatedAt())
        )).toList();
    }

    private Object countTrainingByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : trainingAssignmentRepository.countByStatus()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", trainingAssignmentRepository.count());
    }

    private Object searchSuppliers(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = supplierRepository.findAll(pageable);
        return page.getContent().stream().map(s -> Map.of(
                "id", s.getId().toString(),
                "supplierNumber", nullSafe(s.getSupplierNumber()),
                "name", nullSafe(s.getName()),
                "status", nullSafe(s.getStatus()),
                "supplierType", nullSafe(s.getSupplierType()),
                "createdAt", nullSafe(s.getCreatedAt())
        )).toList();
    }

    private Object countSuppliersByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : supplierRepository.countByStatusGrouped()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", supplierRepository.count());
    }

    private Object searchNonconformances(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = nonconformanceRepository.findAll(pageable);
        return page.getContent().stream().map(nc -> Map.of(
                "id", nc.getId().toString(),
                "ncNumber", nullSafe(nc.getNcNumber()),
                "title", nullSafe(nc.getTitle()),
                "status", nullSafe(nc.getStatus()),
                "createdAt", nullSafe(nc.getCreatedAt())
        )).toList();
    }

    private Object countNonconformancesByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : nonconformanceRepository.countByStatusGrouped()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", nonconformanceRepository.count());
    }

    private Object searchRiskAssessments(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = riskAssessmentRepository.findAll(pageable);
        return page.getContent().stream().map(r -> Map.of(
                "id", r.getId().toString(),
                "status", nullSafe(r.getStatus()),
                "createdAt", nullSafe(r.getCreatedAt())
        )).toList();
    }

    private Object countRisksByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : riskAssessmentRepository.countByStatusGrouped()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", riskAssessmentRepository.count());
    }

    private Object searchEquipment(Map<String, Object> args) {
        var pageable = pageOf(args);
        var page = equipmentRepository.findAll(pageable);
        return page.getContent().stream().map(e -> Map.of(
                "id", e.getId().toString(),
                "equipmentNumber", nullSafe(e.getEquipmentNumber()),
                "name", nullSafe(e.getName()),
                "status", nullSafe(e.getStatus()),
                "equipmentType", nullSafe(e.getEquipmentType()),
                "createdAt", nullSafe(e.getCreatedAt())
        )).toList();
    }

    private Object countEquipmentByStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : equipmentRepository.countByStatusGrouped()) {
            result.put(row[0].toString(), row[1]);
        }
        return Map.of("countsByStatus", result, "total", equipmentRepository.count());
    }

    private Object getQmsSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("capas", countCapasByStatus());
        summary.put("deviations", countDeviationsByStatus());
        summary.put("changeRequests", countChangeRequestsByStatus());
        summary.put("complaints", countComplaintsByStatus());
        summary.put("audits", countAuditsByStatus());
        summary.put("documents", countDocumentsByStatus());
        summary.put("training", countTrainingByStatus());
        summary.put("suppliers", countSuppliersByStatus());
        summary.put("nonconformances", countNonconformancesByStatus());
        summary.put("risks", countRisksByStatus());
        summary.put("equipment", countEquipmentByStatus());
        return summary;
    }

    // ────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────

    private OpenAiLlmService.ToolDefinition tool(String name, String description, Map<String, Object> properties) {
        return OpenAiLlmService.ToolDefinition.builder()
                .name(name)
                .description(description)
                .parameters(properties)
                .build();
    }

    private Map<String, Object> prop(String type, String description) {
        return Map.of("type", type, "description", description);
    }

    private Map<String, Object> parseArgs(String json) {
        try {
            if (json == null || json.isBlank() || json.equals("{}")) return Map.of();
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse tool arguments: {}", json);
            return Map.of();
        }
    }

    private String str(Map<String, Object> args, String key) {
        Object v = args.get(key);
        return v != null ? v.toString() : "";
    }

    private PageRequest pageOf(Map<String, Object> args) {
        int limit = 20;
        Object l = args.get("limit");
        if (l != null) {
            try { limit = Integer.parseInt(l.toString()); } catch (NumberFormatException ignored) {}
        }
        return PageRequest.of(0, Math.min(limit, 50), Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private String nullSafe(Object obj) {
        return obj != null ? obj.toString() : "";
    }
}
