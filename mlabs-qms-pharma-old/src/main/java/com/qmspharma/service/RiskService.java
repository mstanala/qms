package com.qmspharma.service;

import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.model.entity.*;
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
public class RiskService {

    private static final String PROCESS_KEY = "riskRegisterProcess";
    private static final String RECORD_TYPE = "RISK_REGISTER";

    private final RiskRegisterRepository registerRepository;
    private final RiskAssessmentRepository assessmentRepository;
    private final RiskControlRepository controlRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    // ─── Risk Registers ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<RiskRegister> listRegisters(String status, String riskType, String methodology,
                                             UUID plantSiteId, String search, Pageable pageable) {
        Specification<RiskRegister> spec = Specification.where(null);
        if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        if (riskType != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("riskType"), riskType));
        if (methodology != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("methodology"), methodology));
        if (plantSiteId != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("plantSite").get("id"), plantSiteId));
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.or(
                    cb.like(cb.lower(r.get("title")), like),
                    cb.like(cb.lower(r.get("registerNumber")), like)
            ));
        }
        return registerRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public RiskRegister getRegisterById(UUID id) {
        return registerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Risk register not found: " + id));
    }

    @Transactional
    public RiskRegister createRegister(Map<String, Object> request) {
        User currentUser = currentUserProvider.getCurrentUser();
        RiskRegister reg = new RiskRegister();
        reg.setRegisterNumber(sequenceGenerator.generateNumber("RISK_REGISTER"));
        reg.setTitle((String) request.get("title"));
        reg.setDescription((String) request.get("description"));
        reg.setRiskType((String) request.get("riskType"));
        reg.setMethodology((String) request.get("methodology"));
        reg.setScope((String) request.get("scope"));
        reg.setPriority((String) request.getOrDefault("priority", "MEDIUM"));

        UUID ownerId = UUID.fromString((String) request.get("ownerId"));
        reg.setOwner(userRepository.getReferenceById(ownerId));

        UUID deptId = UUID.fromString((String) request.get("departmentId"));
        reg.setDepartment(departmentRepository.getReferenceById(deptId));

        UUID siteId = UUID.fromString((String) request.get("plantSiteId"));
        reg.setPlantSite(plantSiteRepository.getReferenceById(siteId));

        if (request.containsKey("reviewFrequencyMonths")) {
            reg.setReviewFrequencyMonths(((Number) request.get("reviewFrequencyMonths")).intValue());
        }

        reg.setStatus("DRAFT");
        reg.setCurrentWorkflowStep("Draft");
        reg.setCreatedBy(currentUser);
        reg.setUpdatedBy(currentUser);

        RiskRegister saved = registerRepository.save(reg);

        auditTrailService.logAction(RECORD_TYPE, saved.getId(), saved.getRegisterNumber(),
                "CREATE", null, null, null,
                "Risk register created: " + saved.getRegisterNumber());

        return saved;
    }

    @Transactional
    public RiskRegister updateRegister(UUID id, Map<String, Object> request) {
        RiskRegister reg = getRegisterById(id);
        User currentUser = currentUserProvider.getCurrentUser();

        if (request.containsKey("title")) reg.setTitle((String) request.get("title"));
        if (request.containsKey("description")) reg.setDescription((String) request.get("description"));
        if (request.containsKey("scope")) reg.setScope((String) request.get("scope"));
        if (request.containsKey("priority")) reg.setPriority((String) request.get("priority"));
        if (request.containsKey("reviewFrequencyMonths")) {
            reg.setReviewFrequencyMonths(((Number) request.get("reviewFrequencyMonths")).intValue());
        }
        reg.setUpdatedBy(currentUser);

        return registerRepository.save(reg);
    }

    // ─── Status Transition — drives Flowable workflow ─────────────────────────────

    @Transactional
    public RiskRegister transitionRegisterStatus(UUID id, String newStatus, Map<String, Object> params) {
        RiskRegister reg = getRegisterById(id);
        User currentUser = currentUserProvider.getCurrentUser();
        String oldStatus = reg.getStatus();

        log.info("Risk register {} transitioning from {} to {}", reg.getRegisterNumber(), oldStatus, newStatus);

        switch (newStatus) {

            case "IN_ASSESSMENT" -> {
                // Draft -> IN_ASSESSMENT: start Flowable process
                UUID ownerId = reg.getOwner().getId();
                Map<String, Object> vars = new HashMap<>();
                vars.put("recordId", reg.getId().toString());
                vars.put("registerNumber", reg.getRegisterNumber());
                vars.put("ownerId", ownerId.toString());
                vars.put("methodology", reg.getMethodology());
                vars.put("riskType", reg.getRiskType());

                String processId = workflowService.startProcess(PROCESS_KEY, reg.getRegisterNumber(), vars);
                reg.setFlowableProcessId(processId);

                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Draft",
                        WorkflowStepStatus.COMPLETED, currentUser, "Risk register submitted for assessment", 1);
                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Risk Evaluation",
                        WorkflowStepStatus.CURRENT, currentUser, null, 2);
                reg.setCurrentWorkflowStep("Risk Evaluation");
            }

            case "EVALUATION" -> {
                // IN_ASSESSMENT -> EVALUATION: QA Reviewer completes risk evaluation
                workflowService.completeCurrentTask(reg.getFlowableProcessId(), new HashMap<>());

                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Risk Evaluation",
                        WorkflowStepStatus.COMPLETED, currentUser, "Risks evaluated and prioritized", 2);
                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Control Planning",
                        WorkflowStepStatus.CURRENT, currentUser, null, 3);
                reg.setCurrentWorkflowStep("Control Planning");
            }

            case "CONTROL_IMPLEMENTATION" -> {
                // EVALUATION -> CONTROL_IMPLEMENTATION: Owner finishes planning controls
                workflowService.completeCurrentTask(reg.getFlowableProcessId(), new HashMap<>());

                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Control Planning",
                        WorkflowStepStatus.COMPLETED, currentUser, "Controls planned", 3);
                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Control Implementation",
                        WorkflowStepStatus.CURRENT, currentUser, null, 4);
                reg.setCurrentWorkflowStep("Control Implementation");
            }

            case "RESIDUAL_RISK_REVIEW" -> {
                // CONTROL_IMPLEMENTATION -> RESIDUAL_RISK_REVIEW: Controls implemented
                workflowService.completeCurrentTask(reg.getFlowableProcessId(), new HashMap<>());

                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Control Implementation",
                        WorkflowStepStatus.COMPLETED, currentUser, "Controls implemented with evidence", 4);
                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Residual Risk Review",
                        WorkflowStepStatus.CURRENT, currentUser, null, 5);
                reg.setCurrentWorkflowStep("Residual Risk Review");
            }

            case "PENDING_APPROVAL" -> {
                // RESIDUAL_RISK_REVIEW -> PENDING_APPROVAL: residual risk acceptable
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("residualDecision", "ACCEPTABLE");
                workflowService.completeCurrentTask(reg.getFlowableProcessId(), taskVars);

                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Residual Risk Review",
                        WorkflowStepStatus.COMPLETED, currentUser, "Residual risks acceptable", 5);
                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Register Approval",
                        WorkflowStepStatus.CURRENT, currentUser, null, 6);
                reg.setCurrentWorkflowStep("Register Approval");
            }

            case "BACK_TO_CONTROL" -> {
                // RESIDUAL_RISK_REVIEW -> loop back to EVALUATION (BPMN goes to controlPlanning)
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("residualDecision", "UNACCEPTABLE");
                workflowService.completeCurrentTask(reg.getFlowableProcessId(), taskVars);

                String comments = params != null ? (String) params.getOrDefault("comments", "Additional controls needed") : "Additional controls needed";
                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Residual Risk Review",
                        WorkflowStepStatus.COMPLETED, currentUser, "Unacceptable - " + comments, 5);
                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Control Planning",
                        WorkflowStepStatus.CURRENT, currentUser, "Re-entered due to unacceptable residual risk", 3);
                reg.setCurrentWorkflowStep("Control Planning");

                // Override newStatus to EVALUATION for the DB
                reg.setStatus("EVALUATION");
                reg.setUpdatedBy(currentUser);
                auditTrailService.logAction(RECORD_TYPE, reg.getId(), reg.getRegisterNumber(),
                        "STATUS_CHANGE", "status", oldStatus, "EVALUATION",
                        "Looped back: unacceptable residual risk");
                return registerRepository.save(reg);
            }

            case "APPROVED" -> {
                // PENDING_APPROVAL -> APPROVED: Final approval
                workflowService.completeCurrentTask(reg.getFlowableProcessId(), new HashMap<>());

                reg.setApprovedBy(currentUser);
                reg.setApprovedDate(Instant.now());
                int freqMonths = reg.getReviewFrequencyMonths() != null ? reg.getReviewFrequencyMonths() : 12;
                reg.setNextReviewDate(Instant.now().plus(freqMonths * 30L, ChronoUnit.DAYS));

                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Register Approval",
                        WorkflowStepStatus.COMPLETED, currentUser, "Risk register approved", 6);
                workflowService.recordStep(RECORD_TYPE, reg.getId(), "Approved",
                        WorkflowStepStatus.COMPLETED, currentUser, "Risk register is now approved", 7);
                reg.setCurrentWorkflowStep("Approved");

                auditTrailService.logAction(RECORD_TYPE, reg.getId(), reg.getRegisterNumber(),
                        "APPROVED", "status", oldStatus, newStatus,
                        "Risk register approved with next review: " + reg.getNextReviewDate());

                try {
                    notificationService.send(
                            reg.getOwner().getId(),
                            "Risk Register Approved",
                            "Risk register " + reg.getRegisterNumber() + " has been approved.",
                            NotificationType.STATUS_CHANGE,
                            RECORD_TYPE, reg.getId(), reg.getRegisterNumber());
                } catch (Exception e) {
                    log.warn("Failed to send approval notification for {}: {}", reg.getRegisterNumber(), e.getMessage());
                }
            }

            case "CLOSED" -> {
                reg.setCurrentWorkflowStep("Closed");
            }

            default -> {
                log.info("Generic status transition for risk register {} to {}", reg.getRegisterNumber(), newStatus);
            }
        }

        if (!Set.of("APPROVED", "BACK_TO_CONTROL").contains(newStatus)) {
            auditTrailService.logAction(RECORD_TYPE, reg.getId(), reg.getRegisterNumber(),
                    "STATUS_CHANGE", "status", oldStatus, newStatus, null);
        }

        reg.setStatus(newStatus);
        reg.setUpdatedBy(currentUser);
        return registerRepository.save(reg);
    }

    // ─── Risk Assessments ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RiskAssessment> listAssessments(UUID registerId) {
        return assessmentRepository.findByRiskRegisterId(registerId);
    }

    @Transactional(readOnly = true)
    public Page<RiskAssessment> listAllAssessments(String status, String riskLevel, String search, Pageable pageable) {
        Specification<RiskAssessment> spec = Specification.where(null);
        if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        if (riskLevel != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("initialRiskLevel"), riskLevel));
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.like(cb.lower(r.get("hazardDescription")), like));
        }
        return assessmentRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public RiskAssessment getAssessmentById(UUID id) {
        return assessmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Risk assessment not found: " + id));
    }

    @Transactional
    public RiskAssessment createAssessment(UUID registerId, Map<String, Object> request) {
        RiskRegister register = getRegisterById(registerId);
        User currentUser = currentUserProvider.getCurrentUser();

        RiskAssessment ra = new RiskAssessment();
        ra.setRiskRegister(register);
        ra.setAssessmentNumber(sequenceGenerator.generateNumber("RISK_ASSESSMENT"));
        ra.setHazardDescription((String) request.get("hazardDescription"));
        ra.setHarmDescription((String) request.get("harmDescription"));
        ra.setRiskCategory((String) request.get("riskCategory"));
        ra.setProcessStep((String) request.get("processStep"));
        ra.setInitialSeverity(((Number) request.get("initialSeverity")).intValue());
        ra.setInitialOccurrence(((Number) request.get("initialOccurrence")).intValue());
        ra.setInitialDetectability(((Number) request.get("initialDetectability")).intValue());
        ra.setInitialRiskLevel(calculateRiskLevel(
                ra.getInitialSeverity(), ra.getInitialOccurrence(), ra.getInitialDetectability()));
        ra.setStatus("IDENTIFIED");
        ra.setCreatedBy(currentUser);
        ra.setUpdatedBy(currentUser);

        RiskAssessment saved = assessmentRepository.save(ra);

        auditTrailService.logAction(RECORD_TYPE, saved.getId(), saved.getAssessmentNumber(),
                "RISK_IDENTIFIED", null, null, null,
                "Risk assessment created: " + saved.getAssessmentNumber() +
                " (RPN=" + (saved.getInitialSeverity() * saved.getInitialOccurrence() * saved.getInitialDetectability()) +
                ", Level=" + saved.getInitialRiskLevel() + ")");

        return saved;
    }

    @Transactional
    public RiskAssessment updateAssessment(UUID id, Map<String, Object> request) {
        RiskAssessment ra = getAssessmentById(id);
        User currentUser = currentUserProvider.getCurrentUser();

        if (request.containsKey("hazardDescription")) ra.setHazardDescription((String) request.get("hazardDescription"));
        if (request.containsKey("harmDescription")) ra.setHarmDescription((String) request.get("harmDescription"));
        if (request.containsKey("riskCategory")) ra.setRiskCategory((String) request.get("riskCategory"));
        if (request.containsKey("status")) {
            String oldStatus = ra.getStatus();
            ra.setStatus((String) request.get("status"));
            auditTrailService.logAction(RECORD_TYPE, ra.getId(), ra.getAssessmentNumber(),
                    "STATUS_CHANGE", "status", oldStatus, ra.getStatus(), null);
        }
        if (request.containsKey("riskAcceptance")) {
            ra.setRiskAcceptance((String) request.get("riskAcceptance"));
            auditTrailService.logAction(RECORD_TYPE, ra.getId(), ra.getAssessmentNumber(),
                    "RISK_EVALUATED", "riskAcceptance", null, ra.getRiskAcceptance(),
                    (String) request.get("justification"));
        }
        if (request.containsKey("justification")) ra.setJustification((String) request.get("justification"));
        if (request.containsKey("assessedById")) {
            ra.setAssessedBy(userRepository.getReferenceById(UUID.fromString((String) request.get("assessedById"))));
            ra.setAssessedDate(Instant.now());
        }

        ra.setUpdatedBy(currentUser);
        return assessmentRepository.save(ra);
    }

    @Transactional
    public RiskAssessment updateResidualRisk(UUID id, Map<String, Object> request) {
        RiskAssessment ra = getAssessmentById(id);
        ra.setResidualSeverity(((Number) request.get("residualSeverity")).intValue());
        ra.setResidualOccurrence(((Number) request.get("residualOccurrence")).intValue());
        ra.setResidualDetectability(((Number) request.get("residualDetectability")).intValue());
        ra.setResidualRiskLevel(calculateRiskLevel(
                ra.getResidualSeverity(), ra.getResidualOccurrence(), ra.getResidualDetectability()));

        if (request.containsKey("riskAcceptance")) {
            ra.setRiskAcceptance((String) request.get("riskAcceptance"));
        }
        if (request.containsKey("justification")) {
            ra.setJustification((String) request.get("justification"));
        }

        ra.setUpdatedBy(currentUserProvider.getCurrentUser());

        int rpn = ra.getResidualSeverity() * ra.getResidualOccurrence() * ra.getResidualDetectability();
        auditTrailService.logAction(RECORD_TYPE, ra.getId(), ra.getAssessmentNumber(),
                "RESIDUAL_RISK_ASSESSED", null, null, null,
                "Residual risk assessed: RPN=" + rpn + ", Level=" + ra.getResidualRiskLevel());

        return assessmentRepository.save(ra);
    }

    // ─── Risk Controls ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RiskControl> listControls(UUID assessmentId) {
        return controlRepository.findByRiskAssessmentId(assessmentId);
    }

    @Transactional
    public RiskControl addControl(UUID assessmentId, Map<String, Object> request) {
        RiskAssessment assessment = getAssessmentById(assessmentId);
        RiskControl ctrl = new RiskControl();
        ctrl.setRiskAssessment(assessment);
        ctrl.setControlNumber(sequenceGenerator.generateNumber("RISK_CONTROL"));
        ctrl.setControlType((String) request.get("controlType"));
        ctrl.setDescription((String) request.get("description"));
        ctrl.setStatus("PLANNED");

        if (request.containsKey("responsibleId")) {
            ctrl.setResponsible(userRepository.getReferenceById(UUID.fromString((String) request.get("responsibleId"))));
        }

        RiskControl saved = controlRepository.save(ctrl);

        auditTrailService.logAction(RECORD_TYPE, assessment.getId(), assessment.getAssessmentNumber(),
                "CONTROL_PLANNED", null, null, null,
                "Control planned: " + saved.getControlNumber() + " (" + saved.getControlType() + ")");

        return saved;
    }

    @Transactional
    public RiskControl updateControl(UUID id, Map<String, Object> request) {
        RiskControl ctrl = controlRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Risk control not found: " + id));

        String oldStatus = ctrl.getStatus();
        if (request.containsKey("status")) ctrl.setStatus((String) request.get("status"));
        if (request.containsKey("effectivenessRating")) ctrl.setEffectivenessRating((String) request.get("effectivenessRating"));
        if (request.containsKey("evidence")) ctrl.setEvidence((String) request.get("evidence"));
        if (request.containsKey("description")) ctrl.setDescription((String) request.get("description"));

        if ("IMPLEMENTED".equals(ctrl.getStatus()) && !"IMPLEMENTED".equals(oldStatus)) {
            ctrl.setImplementationDate(Instant.now());
            auditTrailService.logAction(RECORD_TYPE, ctrl.getRiskAssessment().getId(),
                    ctrl.getRiskAssessment().getAssessmentNumber(),
                    "CONTROL_IMPLEMENTED", "status", oldStatus, "IMPLEMENTED",
                    "Control " + ctrl.getControlNumber() + " implemented");
        }
        if ("VERIFIED".equals(ctrl.getStatus()) && !"VERIFIED".equals(oldStatus)) {
            ctrl.setVerificationDate(Instant.now());
        }

        return controlRepository.save(ctrl);
    }

    // ─── Workflow History ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<WorkflowHistoryResponse> getWorkflowHistory(UUID id) {
        getRegisterById(id);
        return workflowService.getHistory(RECORD_TYPE, id);
    }

    // ─── Dashboard ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalRegisters", registerRepository.count());
        metrics.put("totalAssessments", assessmentRepository.count());
        metrics.put("unacceptableRisks", assessmentRepository.countUnacceptable());
        metrics.put("byStatus", assessmentRepository.countByStatusGrouped());
        metrics.put("byRiskLevel", assessmentRepository.countByInitialRiskLevel());
        metrics.put("registersByType", registerRepository.countByRiskType());
        metrics.put("registersByMethodology", registerRepository.countByMethodology());
        return metrics;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private String calculateRiskLevel(int severity, int occurrence, int detectability) {
        int rpn = severity * occurrence * detectability;
        if (rpn >= 80) return "CRITICAL";
        if (rpn >= 40) return "HIGH";
        if (rpn >= 15) return "MEDIUM";
        return "LOW";
    }
}
