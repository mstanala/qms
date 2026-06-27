package com.qmspharma.service;

import com.qmspharma.model.entity.*;
import com.qmspharma.model.dto.response.ComplaintResponse;
import com.qmspharma.model.dto.response.ReferenceResponse;
import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.model.enums.NotificationType;
import com.qmspharma.model.enums.WorkflowStepStatus;
import com.qmspharma.repository.*;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintService {

    private static final String PROCESS_KEY = "complaintProcess";
    private static final String RECORD_TYPE = "COMPLAINT";

    private final ComplaintRepository complaintRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<ComplaintResponse> list(String status, String complaintType, String classification,
                                 UUID plantSiteId, String search, Pageable pageable) {
        Specification<Complaint> spec = Specification.where(null);
        if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        if (complaintType != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("complaintType"), complaintType));
        if (classification != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("classification"), classification));
        if (plantSiteId != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("plantSite").get("id"), plantSiteId));
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.or(
                    cb.like(cb.lower(r.get("title")), like),
                    cb.like(cb.lower(r.get("complaintNumber")), like)
            ));
        }
        return complaintRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getById(UUID id) {
        return toResponse(getEntityById(id));
    }

    @Transactional
    public ComplaintResponse create(Map<String, Object> request) {
        User currentUser = currentUserProvider.getCurrentUser();
        Complaint c = new Complaint();
        c.setComplaintNumber(sequenceGenerator.generateNumber("COMPLAINT"));
        c.setTitle((String) request.get("title"));
        c.setDescription((String) request.get("description"));
        c.setComplaintType((String) request.get("complaintType"));
        c.setSource((String) request.get("source"));
        c.setPriority((String) request.getOrDefault("priority", "MEDIUM"));
        c.setReceivedDate(Instant.now());
        c.setOwner(userRepository.getReferenceById(UUID.fromString((String) request.get("ownerId"))));
        c.setDepartment(departmentRepository.getReferenceById(UUID.fromString((String) request.get("departmentId"))));
        c.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString((String) request.get("plantSiteId"))));
        if (request.containsKey("productName")) c.setProductName((String) request.get("productName"));
        if (request.containsKey("batchNumber")) c.setBatchNumber((String) request.get("batchNumber"));
        if (request.containsKey("reporterName")) c.setReporterName((String) request.get("reporterName"));
        if (request.containsKey("reporterContact")) c.setReporterContact((String) request.get("reporterContact"));
        if (request.containsKey("reporterType")) c.setReporterType((String) request.get("reporterType"));
        if (request.containsKey("productCode")) c.setProductCode((String) request.get("productCode"));
        c.setStatus("RECEIVED");
        c.setCurrentWorkflowStep("Received");
        c.setCreatedBy(currentUser);
        c.setUpdatedBy(currentUser);

        Complaint saved = complaintRepository.save(c);

        // Start Flowable process
        Map<String, Object> vars = new HashMap<>();
        vars.put("recordId", saved.getId().toString());
        vars.put("complaintNumber", saved.getComplaintNumber());
        vars.put("ownerId", saved.getOwner().getId().toString());
        vars.put("complaintType", saved.getComplaintType());
        vars.put("source", saved.getSource());

        String processId = workflowService.startProcess(PROCESS_KEY, saved.getComplaintNumber(), vars);
        saved.setFlowableProcessId(processId);
        saved = complaintRepository.save(saved);

        auditTrailService.logAction(RECORD_TYPE, saved.getId(), saved.getComplaintNumber(),
                "CREATED", null, null, null, null);

        workflowService.recordStep(RECORD_TYPE, saved.getId(), "Received",
                WorkflowStepStatus.COMPLETED, currentUser, "Complaint received", 1);
        workflowService.recordStep(RECORD_TYPE, saved.getId(), "Initial Assessment",
                WorkflowStepStatus.CURRENT, currentUser, null, 2);

        return toResponse(saved);
    }

    @Transactional
    public ComplaintResponse update(UUID id, Map<String, Object> request) {
        Complaint c = getEntityById(id);
        if (request.containsKey("title")) c.setTitle((String) request.get("title"));
        if (request.containsKey("description")) c.setDescription((String) request.get("description"));
        if (request.containsKey("classification")) c.setClassification((String) request.get("classification"));
        if (request.containsKey("rootCause")) c.setRootCause((String) request.get("rootCause"));
        if (request.containsKey("conclusion")) c.setConclusion((String) request.get("conclusion"));
        if (request.containsKey("responseText")) c.setResponseText((String) request.get("responseText"));
        if (request.containsKey("investigationRequired")) c.setInvestigationRequired((Boolean) request.get("investigationRequired"));
        if (request.containsKey("isAdverseEvent")) c.setIsAdverseEvent((Boolean) request.get("isAdverseEvent"));
        if (request.containsKey("adverseEventReported")) c.setAdverseEventReported((Boolean) request.get("adverseEventReported"));
        if (request.containsKey("regulatoryReportable")) c.setRegulatoryReportable((Boolean) request.get("regulatoryReportable"));
        if (request.containsKey("fieldAlertRequired")) c.setFieldAlertRequired((Boolean) request.get("fieldAlertRequired"));
        if (request.containsKey("capaRequired")) c.setCapaRequired((Boolean) request.get("capaRequired"));
        if (request.containsKey("recallAssessment")) c.setRecallAssessment((String) request.get("recallAssessment"));
        if (request.containsKey("investigatorId")) {
            c.setInvestigator(userRepository.getReferenceById(UUID.fromString((String) request.get("investigatorId"))));
        }
        c.setUpdatedBy(currentUserProvider.getCurrentUser());
        return toResponse(complaintRepository.save(c));
    }

    // ──────────────────────────────────────────────────────────────
    //  STATUS TRANSITION — drives Flowable workflow
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public ComplaintResponse transitionStatus(UUID id, String newStatus, Map<String, Object> params) {
        Complaint c = getEntityById(id);
        User currentUser = currentUserProvider.getCurrentUser();
        String oldStatus = c.getStatus();

        log.info("Complaint {} transitioning from {} to {}", c.getComplaintNumber(), oldStatus, newStatus);

        boolean statusSetInCase = false;

        switch (newStatus) {

            case "CLASSIFIED" -> {
                // Initial assessment completed, classify complaint
                // Determine investigation path
                boolean investigationRequired = c.getInvestigationRequired() != null && c.getInvestigationRequired();
                String investigatorId = c.getInvestigator() != null ? c.getInvestigator().getId().toString() : c.getOwner().getId().toString();

                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("investigationRequired", investigationRequired);
                taskVars.put("investigatorId", investigatorId);
                taskVars.put("isAdverseEvent", c.getIsAdverseEvent() != null && c.getIsAdverseEvent());
                workflowService.completeCurrentTask(c.getFlowableProcessId(), taskVars);

                workflowService.recordStep(RECORD_TYPE, c.getId(), "Initial Assessment",
                        WorkflowStepStatus.COMPLETED, currentUser, "Complaint classified as " + c.getClassification(), 2);

                if (c.getIsAdverseEvent() != null && c.getIsAdverseEvent()) {
                    c.setReportingDeadline(c.getReceivedDate().plus(15, ChronoUnit.DAYS));
                    auditTrailService.logAction(RECORD_TYPE, c.getId(), c.getComplaintNumber(),
                            "ADVERSE_EVENT_FLAGGED", null, null, null, "Regulatory reporting deadline set");
                }

                // Status depends on investigation path — NOT always "CLASSIFIED"
                if (investigationRequired) {
                    c.setStatus("UNDER_INVESTIGATION");
                    c.setInvestigationStart(Instant.now());
                    c.setCurrentWorkflowStep("Investigation");
                    workflowService.recordStep(RECORD_TYPE, c.getId(), "Investigation",
                            WorkflowStepStatus.CURRENT, currentUser, null, 3);
                } else {
                    c.setStatus("RESPONSE_PENDING");
                    c.setCurrentWorkflowStep("Response Preparation");
                    workflowService.recordStep(RECORD_TYPE, c.getId(), "Investigation",
                            WorkflowStepStatus.COMPLETED, currentUser, "Investigation not required", 3);
                    workflowService.recordStep(RECORD_TYPE, c.getId(), "Disposition Review",
                            WorkflowStepStatus.COMPLETED, currentUser, "Skipped - no investigation", 4);
                    workflowService.recordStep(RECORD_TYPE, c.getId(), "Response Preparation",
                            WorkflowStepStatus.CURRENT, currentUser, null, 5);
                }
                statusSetInCase = true;

                auditTrailService.logAction(RECORD_TYPE, c.getId(), c.getComplaintNumber(),
                        "CLASSIFIED", "status", oldStatus, c.getStatus(), "Classification: " + c.getClassification());
            }

            case "UNDER_INVESTIGATION" -> {
                // Re-investigation from disposition review (loop back)
                String comments = params != null ? (String) params.get("comments") : null;
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("dispositionDecision", "FURTHER_INVESTIGATION");
                workflowService.completeCurrentTask(c.getFlowableProcessId(), taskVars);

                c.setInvestigationStart(Instant.now());
                c.setInvestigationComplete(null);
                c.setCurrentWorkflowStep("Investigation");
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Disposition Review",
                        WorkflowStepStatus.COMPLETED, currentUser, "Further investigation required", 4);
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Investigation",
                        WorkflowStepStatus.CURRENT, currentUser, comments, 3);

                auditTrailService.logAction(RECORD_TYPE, c.getId(), c.getComplaintNumber(),
                        "REINVESTIGATION", "status", oldStatus, newStatus, comments);
            }

            case "INVESTIGATION_COMPLETE" -> {
                // Investigation done, move to disposition review
                c.setInvestigationComplete(Instant.now());

                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("capaRequired", c.getCapaRequired() != null && c.getCapaRequired());
                taskVars.put("recallAssessment", c.getRecallAssessment() != null ? c.getRecallAssessment() : "NO_RECALL");
                workflowService.completeCurrentTask(c.getFlowableProcessId(), taskVars);

                c.setCurrentWorkflowStep("Disposition Review");
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Investigation",
                        WorkflowStepStatus.COMPLETED, currentUser, "Root cause: " + c.getRootCause(), 3);
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Disposition Review",
                        WorkflowStepStatus.CURRENT, currentUser, null, 4);

                auditTrailService.logAction(RECORD_TYPE, c.getId(), c.getComplaintNumber(),
                        "INVESTIGATION_COMPLETED", "status", oldStatus, newStatus, null);
            }

            case "RESPONSE_PENDING" -> {
                // Disposition approved, move to response preparation
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("dispositionDecision", "APPROVED");
                workflowService.completeCurrentTask(c.getFlowableProcessId(), taskVars);

                c.setCurrentWorkflowStep("Response Preparation");
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Disposition Review",
                        WorkflowStepStatus.COMPLETED, currentUser, "Disposition approved", 4);
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Response Preparation",
                        WorkflowStepStatus.CURRENT, currentUser, null, 5);

                auditTrailService.logAction(RECORD_TYPE, c.getId(), c.getComplaintNumber(),
                        "DISPOSITION_APPROVED", "status", oldStatus, newStatus, null);
            }

            case "RESPONSE_SENT" -> {
                // Response prepared and sent, move to closure review
                c.setResponseSentDate(Instant.now());

                workflowService.completeCurrentTask(c.getFlowableProcessId(), new HashMap<>());

                c.setCurrentWorkflowStep("Closure Review");
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Response Preparation",
                        WorkflowStepStatus.COMPLETED, currentUser, "Response sent to complainant", 5);
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Closure Review",
                        WorkflowStepStatus.CURRENT, currentUser, null, 6);

                auditTrailService.logAction(RECORD_TYPE, c.getId(), c.getComplaintNumber(),
                        "RESPONSE_SENT", "status", oldStatus, newStatus, null);
            }

            case "CLOSED" -> {
                // Final review and closure
                c.setClosedDate(Instant.now());

                workflowService.completeCurrentTask(c.getFlowableProcessId(), new HashMap<>());

                c.setCurrentWorkflowStep("Closed");
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Closure Review",
                        WorkflowStepStatus.COMPLETED, currentUser, "Complaint closed", 6);
                workflowService.recordStep(RECORD_TYPE, c.getId(), "Closed",
                        WorkflowStepStatus.COMPLETED, currentUser, "Complaint closed", 7);

                auditTrailService.logAction(RECORD_TYPE, c.getId(), c.getComplaintNumber(),
                        "STATUS_CHANGE", "status", oldStatus, newStatus, null);

                // Notify owner
                notificationService.send(c.getOwner().getId(),
                        "Complaint Closed: " + c.getComplaintNumber(),
                        "Complaint '" + c.getTitle() + "' has been closed.",
                        NotificationType.STATUS_CHANGE,
                        RECORD_TYPE, c.getId(), c.getComplaintNumber());
            }

            default -> {
                log.warn("Unhandled complaint status transition: {} -> {}", oldStatus, newStatus);
                auditTrailService.logAction(RECORD_TYPE, c.getId(), c.getComplaintNumber(),
                        "STATUS_CHANGE", "status", oldStatus, newStatus, null);
            }
        }

        if (!statusSetInCase) {
            c.setStatus(newStatus);
        }
        c.setUpdatedBy(currentUser);
        return toResponse(complaintRepository.save(c));
    }

    // ──────────────────────────────────────────────────────────────
    //  WORKFLOW HISTORY
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<WorkflowHistoryResponse> getWorkflowHistory(UUID id) {
        getEntityById(id);
        return workflowService.getHistory(RECORD_TYPE, id);
    }

    // ──────────────────────────────────────────────────────────────
    //  DASHBOARD
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalComplaints", complaintRepository.count());
        m.put("overdue", complaintRepository.countOverdue());
        m.put("unreportedAdverseEvents", complaintRepository.countUnreportedAdverseEvents());
        m.put("byStatus", complaintRepository.countByStatusGrouped());
        m.put("byType", complaintRepository.countByComplaintType());
        m.put("byClassification", complaintRepository.countByClassification());
        return m;
    }

    // ──────────────────────────────────────────────────────────────
    //  PRIVATE helpers
    // ──────────────────────────────────────────────────────────────

    private Complaint getEntityById(UUID id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Complaint not found: " + id));
    }

    private ComplaintResponse toResponse(Complaint c) {
        return ComplaintResponse.builder()
                .id(c.getId())
                .complaintNumber(c.getComplaintNumber())
                .title(c.getTitle())
                .description(c.getDescription())
                .complaintType(c.getComplaintType())
                .source(c.getSource())
                .classification(c.getClassification())
                .status(c.getStatus())
                .priority(c.getPriority())
                .reporterName(c.getReporterName())
                .reporterContact(c.getReporterContact())
                .reporterType(c.getReporterType())
                .receivedDate(c.getReceivedDate())
                .productName(c.getProductName())
                .productCode(c.getProductCode())
                .batchNumber(c.getBatchNumber())
                .expiryDate(c.getExpiryDate())
                .quantityAffected(c.getQuantityAffected())
                .investigationRequired(c.getInvestigationRequired())
                .investigator(toUserRef(c.getInvestigator()))
                .investigationStart(c.getInvestigationStart())
                .investigationComplete(c.getInvestigationComplete())
                .rootCause(c.getRootCause())
                .conclusion(c.getConclusion())
                .isAdverseEvent(c.getIsAdverseEvent())
                .adverseEventReported(c.getAdverseEventReported())
                .reportingDeadline(c.getReportingDeadline())
                .regulatoryReportable(c.getRegulatoryReportable())
                .fieldAlertRequired(c.getFieldAlertRequired())
                .recallAssessment(c.getRecallAssessment())
                .capaRequired(c.getCapaRequired())
                .capaId(c.getCapa() != null ? c.getCapa().getId() : null)
                .deviationId(c.getDeviation() != null ? c.getDeviation().getId() : null)
                .responseDueDate(c.getResponseDueDate())
                .responseSentDate(c.getResponseSentDate())
                .responseText(c.getResponseText())
                .owner(toUserRef(c.getOwner()))
                .department(toDepartmentRef(c.getDepartment()))
                .plantSite(toPlantSiteRef(c.getPlantSite()))
                .currentWorkflowStep(c.getCurrentWorkflowStep())
                .flowableProcessId(c.getFlowableProcessId())
                .closedDate(c.getClosedDate())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ReferenceResponse toUserRef(User user) {
        if (user == null) return null;
        return ReferenceResponse.builder()
                .id(user.getId())
                .name(user.getDisplayName())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .build();
    }

    private ReferenceResponse toDepartmentRef(Department department) {
        if (department == null) return null;
        return ReferenceResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .build();
    }

    private ReferenceResponse toPlantSiteRef(PlantSite site) {
        if (site == null) return null;
        return ReferenceResponse.builder()
                .id(site.getId())
                .name(site.getName())
                .code(site.getCode())
                .build();
    }
}
