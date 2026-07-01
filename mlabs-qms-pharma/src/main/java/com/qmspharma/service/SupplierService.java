package com.qmspharma.service;

import com.qmspharma.model.entity.*;
import com.qmspharma.model.dto.response.ReferenceResponse;
import com.qmspharma.model.dto.response.SupplierResponse;
import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierService {

    private static final String PROCESS_KEY = "supplierQualificationProcess";
    private static final String RECORD_TYPE = "SUPPLIER";

    private final SupplierRepository supplierRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final CurrentUserProvider currentUserProvider;

    // ──────────────────────────────────────────────────────────────
    //  READ operations
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<SupplierResponse> list(String status, String supplierType, String category, String search, Pageable pageable) {
        Specification<Supplier> spec = Specification.where(null);
        if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        if (supplierType != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("supplierType"), supplierType));
        if (category != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("category"), category));
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.or(
                    cb.like(cb.lower(r.get("name")), like),
                    cb.like(cb.lower(r.get("supplierNumber")), like)
            ));
        }
        return supplierRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public SupplierResponse getById(UUID id) {
        return toResponse(getEntityById(id));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalSuppliers", supplierRepository.count());
        m.put("byStatus", supplierRepository.countByStatusGrouped());
        m.put("byType", supplierRepository.countBySupplierType());
        m.put("byCategory", supplierRepository.countByCategory());
        return m;
    }

    // ──────────────────────────────────────────────────────────────
    //  CREATE — starts Flowable process
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public SupplierResponse create(Map<String, Object> request) {
        User currentUser = currentUserProvider.getCurrentUser();

        Supplier s = new Supplier();
        s.setSupplierNumber(sequenceGenerator.generateNumber("SUPPLIER"));
        s.setName((String) request.get("name"));
        s.setLegalName((String) request.get("legalName"));
        s.setSupplierType((String) request.get("supplierType"));
        s.setCategory((String) request.get("category"));
        s.setAddress((String) request.get("address"));
        s.setCity((String) request.get("city"));
        s.setState((String) request.get("state"));
        s.setCountry((String) request.get("country"));
        s.setPostalCode((String) request.get("postalCode"));
        s.setPrimaryContactName((String) request.get("primaryContactName"));
        s.setPrimaryContactEmail((String) request.get("primaryContactEmail"));
        s.setPrimaryContactPhone((String) request.get("primaryContactPhone"));
        s.setGmpCertification((String) request.get("gmpCertification"));
        s.setIsoCertification((String) request.get("isoCertification"));
        s.setFdaRegistration((String) request.get("fdaRegistration"));
        s.setDunsNumber((String) request.get("dunsNumber"));

        if (request.get("requalificationFrequencyMonths") != null) {
            s.setRequalificationFrequencyMonths(((Number) request.get("requalificationFrequencyMonths")).intValue());
        }

        s.setOwner(userRepository.getReferenceById(UUID.fromString((String) request.get("ownerId"))));

        String plantSiteId = stringValue(request.get("plantSiteId"));
        if (plantSiteId != null) {
            s.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString(plantSiteId)));
        }

        s.setStatus("PENDING_QUALIFICATION");
        s.setCurrentWorkflowStep("Pending");
        s.setCreatedBy(currentUser);
        s.setUpdatedBy(currentUser);
        s = supplierRepository.save(s);

        // Start Flowable process
        Map<String, Object> vars = new HashMap<>();
        vars.put("recordId", s.getId().toString());
        vars.put("supplierNumber", s.getSupplierNumber());
        vars.put("supplierName", s.getName());
        vars.put("qualificationOwnerId", s.getOwner().getId().toString());
        vars.put("supplierType", s.getSupplierType());
        vars.put("category", s.getCategory());

        String processId = workflowService.startProcess(PROCESS_KEY, s.getSupplierNumber(), vars);
        s.setFlowableProcessId(processId);
        s = supplierRepository.save(s);

        // Audit trail
        auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                "CREATED", null, null, null, null);

        // Workflow steps: "Pending" completed, "Document Review" current
        workflowService.recordStep(RECORD_TYPE, s.getId(), "Pending",
                WorkflowStepStatus.COMPLETED, currentUser, "Supplier registered", 1);
        workflowService.recordStep(RECORD_TYPE, s.getId(), "Document Review",
                WorkflowStepStatus.CURRENT, currentUser, null, 2);

        return toResponse(s);
    }

    // ──────────────────────────────────────────────────────────────
    //  UPDATE — field edits (no status change)
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public SupplierResponse update(UUID id, Map<String, Object> request) {
        Supplier s = getEntityById(id);

        if (request.containsKey("name")) s.setName((String) request.get("name"));
        if (request.containsKey("legalName")) s.setLegalName((String) request.get("legalName"));
        if (request.containsKey("address")) s.setAddress((String) request.get("address"));
        if (request.containsKey("city")) s.setCity((String) request.get("city"));
        if (request.containsKey("state")) s.setState((String) request.get("state"));
        if (request.containsKey("country")) s.setCountry((String) request.get("country"));
        if (request.containsKey("postalCode")) s.setPostalCode((String) request.get("postalCode"));
        if (request.containsKey("primaryContactName")) s.setPrimaryContactName((String) request.get("primaryContactName"));
        if (request.containsKey("primaryContactEmail")) s.setPrimaryContactEmail((String) request.get("primaryContactEmail"));
        if (request.containsKey("primaryContactPhone")) s.setPrimaryContactPhone((String) request.get("primaryContactPhone"));
        if (request.containsKey("gmpCertification")) s.setGmpCertification((String) request.get("gmpCertification"));
        if (request.containsKey("isoCertification")) s.setIsoCertification((String) request.get("isoCertification"));
        if (request.containsKey("fdaRegistration")) s.setFdaRegistration((String) request.get("fdaRegistration"));
        if (request.containsKey("dunsNumber")) s.setDunsNumber((String) request.get("dunsNumber"));
        if (request.containsKey("requalificationFrequencyMonths")) {
            s.setRequalificationFrequencyMonths(((Number) request.get("requalificationFrequencyMonths")).intValue());
        }

        // Handle score updates via the update endpoint as well
        boolean scoresChanged = false;
        if (request.containsKey("qualityScore")) {
            s.setQualityScore(toBigDecimal(request.get("qualityScore")));
            scoresChanged = true;
        }
        if (request.containsKey("deliveryScore")) {
            s.setDeliveryScore(toBigDecimal(request.get("deliveryScore")));
            scoresChanged = true;
        }
        if (request.containsKey("complianceScore")) {
            s.setComplianceScore(toBigDecimal(request.get("complianceScore")));
            scoresChanged = true;
        }

        if (scoresChanged) {
            recalculateOverallScore(s);
            checkAutoProbation(s);
        }

        s.setUpdatedBy(currentUserProvider.getCurrentUser());
        auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                "UPDATED", null, null, null, null);
        return toResponse(supplierRepository.save(s));
    }

    // ──────────────────────────────────────────────────────────────
    //  SCORE UPDATE — dedicated endpoint
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public SupplierResponse updateScores(UUID id, BigDecimal qualityScore, BigDecimal deliveryScore, BigDecimal complianceScore) {
        Supplier s = getEntityById(id);
        User currentUser = currentUserProvider.getCurrentUser();

        String oldOverall = s.getOverallScore() != null ? s.getOverallScore().toString() : null;

        if (qualityScore != null) s.setQualityScore(qualityScore);
        if (deliveryScore != null) s.setDeliveryScore(deliveryScore);
        if (complianceScore != null) s.setComplianceScore(complianceScore);

        recalculateOverallScore(s);

        String newOverall = s.getOverallScore() != null ? s.getOverallScore().toString() : null;

        auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                "SCORE_UPDATED", "overallScore", oldOverall, newOverall,
                "Quality=" + qualityScore + " Delivery=" + deliveryScore + " Compliance=" + complianceScore);

        checkAutoProbation(s);

        s.setUpdatedBy(currentUser);
        return toResponse(supplierRepository.save(s));
    }

    // ──────────────────────────────────────────────────────────────
    //  STATUS TRANSITION — drives Flowable workflow
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public SupplierResponse transitionStatus(UUID id, String newStatus, Map<String, Object> params) {
        Supplier s = getEntityById(id);
        User currentUser = currentUserProvider.getCurrentUser();
        String oldStatus = s.getStatus();

        log.info("Supplier {} transitioning from {} to {}", s.getSupplierNumber(), oldStatus, newStatus);

        switch (newStatus) {

            case "UNDER_EVALUATION" -> {
                // Document review completed — decision drives the BPMN gateway
                String documentDecision = params != null ? (String) params.get("documentDecision") : null;
                if (documentDecision == null) {
                    throw new IllegalArgumentException("documentDecision is required for UNDER_EVALUATION transition");
                }

                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("documentDecision", documentDecision);
                workflowService.completeCurrentTask(s.getFlowableProcessId(), taskVars);

                if ("AUDIT_REQUIRED".equals(documentDecision)) {
                    // Doc review done, audit next
                    workflowService.recordStep(RECORD_TYPE, s.getId(), "Document Review",
                            WorkflowStepStatus.COMPLETED, currentUser, "Audit required", 2);
                    workflowService.recordStep(RECORD_TYPE, s.getId(), "Supplier Audit",
                            WorkflowStepStatus.CURRENT, currentUser, null, 3);
                    s.setCurrentWorkflowStep("Supplier Audit");
                } else if ("NO_AUDIT".equals(documentDecision)) {
                    // Doc review done, skip to approval
                    workflowService.recordStep(RECORD_TYPE, s.getId(), "Document Review",
                            WorkflowStepStatus.COMPLETED, currentUser, "No audit required", 2);
                    workflowService.recordStep(RECORD_TYPE, s.getId(), "Qualification Approval",
                            WorkflowStepStatus.CURRENT, currentUser, null, 5);
                    s.setCurrentWorkflowStep("Qualification Approval");
                }
            }

            case "REJECTED" -> {
                // Rejected from document review
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("documentDecision", "REJECTED");
                workflowService.completeCurrentTask(s.getFlowableProcessId(), taskVars);

                workflowService.recordStep(RECORD_TYPE, s.getId(), "Document Review",
                        WorkflowStepStatus.COMPLETED, currentUser, "Supplier rejected at document review", 2);
                s.setCurrentWorkflowStep("Rejected");

                auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                        "SUPPLIER_REJECTED", "status", oldStatus, newStatus, "Rejected during document review");
            }

            case "PENDING_APPROVAL" -> {
                // Can come from: audit passed OR corrective action completed
                if ("UNDER_EVALUATION".equals(oldStatus) || "PENDING_QUALIFICATION".equals(oldStatus)) {
                    // After audit passed
                    Map<String, Object> taskVars = new HashMap<>();
                    taskVars.put("auditResult", getParamOrDefault(params, "auditResult", "PASSED"));
                    workflowService.completeCurrentTask(s.getFlowableProcessId(), taskVars);

                    workflowService.recordStep(RECORD_TYPE, s.getId(), "Supplier Audit",
                            WorkflowStepStatus.COMPLETED, currentUser, "Audit passed", 3);
                    workflowService.recordStep(RECORD_TYPE, s.getId(), "Qualification Approval",
                            WorkflowStepStatus.CURRENT, currentUser, null, 5);
                } else if ("CORRECTIVE_ACTION_REQUIRED".equals(oldStatus)) {
                    // After corrective action completed
                    workflowService.completeCurrentTask(s.getFlowableProcessId(), new HashMap<>());

                    workflowService.recordStep(RECORD_TYPE, s.getId(), "Corrective Action",
                            WorkflowStepStatus.COMPLETED, currentUser, "Corrective actions completed", 4);
                    workflowService.recordStep(RECORD_TYPE, s.getId(), "Qualification Approval",
                            WorkflowStepStatus.CURRENT, currentUser, null, 5);
                }
                s.setCurrentWorkflowStep("Qualification Approval");
            }

            case "CORRECTIVE_ACTION_REQUIRED" -> {
                // Audit failed
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("auditResult", "FAILED");
                workflowService.completeCurrentTask(s.getFlowableProcessId(), taskVars);

                workflowService.recordStep(RECORD_TYPE, s.getId(), "Supplier Audit",
                        WorkflowStepStatus.COMPLETED, currentUser, "Audit failed - corrective action required", 3);
                workflowService.recordStep(RECORD_TYPE, s.getId(), "Corrective Action",
                        WorkflowStepStatus.CURRENT, currentUser, null, 4);
                s.setCurrentWorkflowStep("Corrective Action");
            }

            case "QUALIFIED" -> {
                // Qualification approval granted
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("approvalDecision", "APPROVED");
                workflowService.completeCurrentTask(s.getFlowableProcessId(), taskVars);

                // Set qualification dates
                s.setQualificationDate(Instant.now());
                int freqMonths = s.getRequalificationFrequencyMonths() != null
                        ? s.getRequalificationFrequencyMonths() : 36;
                s.setNextRequalificationDate(Instant.now().plus(freqMonths * 30L, ChronoUnit.DAYS));

                // Calculate overall score if individual scores exist
                recalculateOverallScore(s);

                workflowService.recordStep(RECORD_TYPE, s.getId(), "Qualification Approval",
                        WorkflowStepStatus.COMPLETED, currentUser, "Supplier qualified", 5);
                workflowService.recordStep(RECORD_TYPE, s.getId(), "Qualified",
                        WorkflowStepStatus.COMPLETED, currentUser, "Supplier is now qualified", 6);
                s.setCurrentWorkflowStep("Qualified");

                auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                        "SUPPLIER_QUALIFIED", "status", oldStatus, newStatus, null);
            }

            case "ON_PROBATION" -> {
                s.setCurrentWorkflowStep("On Probation");
                auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                        "SUPPLIER_ON_PROBATION", "status", oldStatus, newStatus,
                        "Supplier placed on probation");
                workflowService.recordStep(RECORD_TYPE, s.getId(), "On Probation",
                        WorkflowStepStatus.CURRENT, currentUser, "Performance below threshold", 7);
            }

            case "SUSPENDED" -> {
                s.setCurrentWorkflowStep("Suspended");
                auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                        "SUPPLIER_SUSPENDED", "status", oldStatus, newStatus, "Supplier suspended");
                workflowService.recordStep(RECORD_TYPE, s.getId(), "Suspended",
                        WorkflowStepStatus.CURRENT, currentUser, "Supplier suspended", 8);
            }

            case "DISQUALIFIED" -> {
                s.setCurrentWorkflowStep("Disqualified");
                auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                        "SUPPLIER_DISQUALIFIED", "status", oldStatus, newStatus, "Supplier disqualified");
                workflowService.recordStep(RECORD_TYPE, s.getId(), "Disqualified",
                        WorkflowStepStatus.COMPLETED, currentUser, "Supplier disqualified", 9);
            }

            default -> {
                // Generic transition for any other valid status
                log.info("Generic status transition for supplier {} to {}", s.getSupplierNumber(), newStatus);
            }
        }

        // Always record status change in audit trail (if not already logged above for specific cases)
        if (!Set.of("REJECTED", "QUALIFIED", "ON_PROBATION", "SUSPENDED", "DISQUALIFIED").contains(newStatus)) {
            auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                    "STATUS_CHANGE", "status", oldStatus, newStatus, null);
        }

        s.setStatus(newStatus);
        s.setUpdatedBy(currentUser);
        return toResponse(supplierRepository.save(s));
    }

    // ──────────────────────────────────────────────────────────────
    //  REQUALIFICATION — restart the evaluation cycle
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public SupplierResponse startRequalification(UUID id) {
        Supplier s = getEntityById(id);
        User currentUser = currentUserProvider.getCurrentUser();
        String oldStatus = s.getStatus();

        s.setStatus("UNDER_EVALUATION");
        s.setCurrentWorkflowStep("Document Review");

        // Start a new Flowable process for the requalification cycle
        Map<String, Object> vars = new HashMap<>();
        vars.put("recordId", s.getId().toString());
        vars.put("supplierNumber", s.getSupplierNumber());
        vars.put("supplierName", s.getName());
        vars.put("qualificationOwnerId", s.getOwner().getId().toString());
        vars.put("supplierType", s.getSupplierType());
        vars.put("category", s.getCategory());

        String processId = workflowService.startProcess(PROCESS_KEY, s.getSupplierNumber() + "-REQUAL-" + System.currentTimeMillis(), vars);
        s.setFlowableProcessId(processId);

        auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                "REQUALIFICATION_STARTED", "status", oldStatus, "UNDER_EVALUATION",
                "Requalification cycle initiated");

        workflowService.recordStep(RECORD_TYPE, s.getId(), "Requalification Started",
                WorkflowStepStatus.COMPLETED, currentUser, "Requalification cycle initiated", 10);
        workflowService.recordStep(RECORD_TYPE, s.getId(), "Document Review",
                WorkflowStepStatus.CURRENT, currentUser, "Requalification document review", 11);

        s.setUpdatedBy(currentUser);
        return toResponse(supplierRepository.save(s));
    }

    // ──────────────────────────────────────────────────────────────
    //  WORKFLOW HISTORY
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<WorkflowHistoryResponse> getWorkflowHistory(UUID id) {
        // Verify supplier exists
        getEntityById(id);
        return workflowService.getHistory(RECORD_TYPE, id);
    }

    // ──────────────────────────────────────────────────────────────
    //  PRIVATE helpers
    // ──────────────────────────────────────────────────────────────

    private Supplier getEntityById(UUID id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));
    }

    private void recalculateOverallScore(Supplier s) {
        int count = 0;
        BigDecimal total = BigDecimal.ZERO;
        if (s.getQualityScore() != null) { total = total.add(s.getQualityScore()); count++; }
        if (s.getDeliveryScore() != null) { total = total.add(s.getDeliveryScore()); count++; }
        if (s.getComplianceScore() != null) { total = total.add(s.getComplianceScore()); count++; }
        if (count > 0) {
            s.setOverallScore(total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP));
        }
    }

    private void checkAutoProbation(Supplier s) {
        if (s.getOverallScore() != null
                && s.getOverallScore().compareTo(BigDecimal.valueOf(70)) < 0
                && "QUALIFIED".equals(s.getStatus())) {
            String oldStatus = s.getStatus();
            s.setStatus("ON_PROBATION");
            s.setCurrentWorkflowStep("On Probation");
            auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                    "AUTO_PROBATION", "status", oldStatus, "ON_PROBATION",
                    "Overall score dropped below 70: " + s.getOverallScore());
            log.info("Supplier {} auto-transitioned to ON_PROBATION (score={})",
                    s.getSupplierNumber(), s.getOverallScore());
        }
    }

    private String getParamOrDefault(Map<String, Object> params, String key, String defaultValue) {
        if (params != null && params.containsKey(key)) {
            return (String) params.get(key);
        }
        return defaultValue;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        return new BigDecimal(value.toString());
    }

    private SupplierResponse toResponse(Supplier s) {
        return SupplierResponse.builder()
                .id(s.getId())
                .supplierNumber(s.getSupplierNumber())
                .name(s.getName())
                .legalName(s.getLegalName())
                .supplierType(s.getSupplierType())
                .category(s.getCategory())
                .status(s.getStatus())
                .address(s.getAddress())
                .city(s.getCity())
                .state(s.getState())
                .country(s.getCountry())
                .postalCode(s.getPostalCode())
                .primaryContactName(s.getPrimaryContactName())
                .primaryContactEmail(s.getPrimaryContactEmail())
                .primaryContactPhone(s.getPrimaryContactPhone())
                .gmpCertification(s.getGmpCertification())
                .isoCertification(s.getIsoCertification())
                .fdaRegistration(s.getFdaRegistration())
                .dunsNumber(s.getDunsNumber())
                .qualificationDate(s.getQualificationDate())
                .nextRequalificationDate(s.getNextRequalificationDate())
                .requalificationFrequencyMonths(s.getRequalificationFrequencyMonths())
                .overallScore(s.getOverallScore())
                .qualityScore(s.getQualityScore())
                .deliveryScore(s.getDeliveryScore())
                .complianceScore(s.getComplianceScore())
                .owner(toUserRef(s.getOwner()))
                .plantSite(toPlantSiteRef(s.getPlantSite()))
                .currentWorkflowStep(s.getCurrentWorkflowStep())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
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

    private ReferenceResponse toPlantSiteRef(PlantSite site) {
        if (site == null) return null;
        return ReferenceResponse.builder()
                .id(site.getId())
                .name(site.getName())
                .code(site.getCode())
                .build();
    }

    private String stringValue(Object value) {
        if (value == null) return null;
        String string = value.toString().trim();
        return string.isEmpty() ? null : string;
    }
}
