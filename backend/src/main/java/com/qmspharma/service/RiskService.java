package com.qmspharma.service;

import com.qmspharma.model.entity.*;
import com.qmspharma.repository.*;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RiskService {

    private static final String RECORD_TYPE = "RISK_ASSESSMENT";

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
            reg.setReviewFrequencyMonths((Integer) request.get("reviewFrequencyMonths"));
        }

        reg.setCreatedBy(currentUser);
        reg.setUpdatedBy(currentUser);

        RiskRegister saved = registerRepository.save(reg);

        auditTrailService.logAction(RECORD_TYPE, saved.getId(), saved.getRegisterNumber(),
                "CREATE", null, null, null,
                "Risk register created: " + saved.getRegisterNumber());

        workflowService.startProcess("riskRegisterProcess", saved.getId().toString(),
                Map.of("ownerId", ownerId.toString()));

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
            reg.setReviewFrequencyMonths((Integer) request.get("reviewFrequencyMonths"));
        }
        reg.setUpdatedBy(currentUser);

        return registerRepository.save(reg);
    }

    @Transactional
    public RiskRegister transitionRegisterStatus(UUID id, String newStatus) {
        RiskRegister reg = getRegisterById(id);
        String oldStatus = reg.getStatus();
        reg.setStatus(newStatus);
        reg.setUpdatedBy(currentUserProvider.getCurrentUser());

        if ("APPROVED".equals(newStatus)) {
            reg.setApprovedBy(currentUserProvider.getCurrentUser());
            reg.setApprovedDate(Instant.now());
        }

        auditTrailService.logAction(RECORD_TYPE, reg.getId(), reg.getRegisterNumber(),
                "STATUS_CHANGE", "status", oldStatus, newStatus, null);

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
        ra.setInitialSeverity((Integer) request.get("initialSeverity"));
        ra.setInitialOccurrence((Integer) request.get("initialOccurrence"));
        ra.setInitialDetectability((Integer) request.get("initialDetectability"));
        ra.setInitialRiskLevel(calculateRiskLevel(
                ra.getInitialSeverity(), ra.getInitialOccurrence(), ra.getInitialDetectability()));
        ra.setCreatedBy(currentUser);
        ra.setUpdatedBy(currentUser);

        RiskAssessment saved = assessmentRepository.save(ra);

        auditTrailService.logAction(RECORD_TYPE, saved.getId(), saved.getAssessmentNumber(),
                "CREATE", null, null, null,
                "Risk assessment created: " + saved.getAssessmentNumber());

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
        if (request.containsKey("riskAcceptance")) ra.setRiskAcceptance((String) request.get("riskAcceptance"));
        if (request.containsKey("justification")) ra.setJustification((String) request.get("justification"));

        ra.setUpdatedBy(currentUser);
        return assessmentRepository.save(ra);
    }

    @Transactional
    public RiskAssessment updateResidualRisk(UUID id, Map<String, Object> request) {
        RiskAssessment ra = getAssessmentById(id);
        ra.setResidualSeverity((Integer) request.get("residualSeverity"));
        ra.setResidualOccurrence((Integer) request.get("residualOccurrence"));
        ra.setResidualDetectability((Integer) request.get("residualDetectability"));
        ra.setResidualRiskLevel(calculateRiskLevel(
                ra.getResidualSeverity(), ra.getResidualOccurrence(), ra.getResidualDetectability()));
        ra.setUpdatedBy(currentUserProvider.getCurrentUser());
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
        ctrl.setControlNumber((String) request.get("controlNumber"));
        ctrl.setControlType((String) request.get("controlType"));
        ctrl.setDescription((String) request.get("description"));

        if (request.containsKey("responsibleId")) {
            ctrl.setResponsible(userRepository.getReferenceById(UUID.fromString((String) request.get("responsibleId"))));
        }

        return controlRepository.save(ctrl);
    }

    @Transactional
    public RiskControl updateControl(UUID id, Map<String, Object> request) {
        RiskControl ctrl = controlRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Risk control not found: " + id));
        if (request.containsKey("status")) ctrl.setStatus((String) request.get("status"));
        if (request.containsKey("effectivenessRating")) ctrl.setEffectivenessRating((String) request.get("effectivenessRating"));
        if (request.containsKey("evidence")) ctrl.setEvidence((String) request.get("evidence"));
        return controlRepository.save(ctrl);
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
