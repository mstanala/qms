package com.qmspharma.service;

import com.qmspharma.model.entity.*;
import com.qmspharma.model.dto.response.NonconformanceResponse;
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
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class NonconformanceService {

    private static final String RECORD_TYPE = "NONCONFORMANCE";

    private final NonconformanceRepository ncRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final DeviationRepository deviationRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<NonconformanceResponse> list(String status, String ncType, String holdStatus,
                                      UUID plantSiteId, String search, Pageable pageable) {
        Specification<Nonconformance> spec = Specification.where(null);
        if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        if (ncType != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("ncType"), ncType));
        if (holdStatus != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("holdStatus"), holdStatus));
        if (plantSiteId != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("plantSite").get("id"), plantSiteId));
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.or(
                    cb.like(cb.lower(r.get("title")), like),
                    cb.like(cb.lower(r.get("ncNumber")), like)
            ));
        }
        return ncRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public NonconformanceResponse getById(UUID id) {
        return toResponse(getEntityById(id));
    }

    @Transactional
    public NonconformanceResponse create(Map<String, Object> request) {
        User currentUser = currentUserProvider.getCurrentUser();
        Nonconformance nc = new Nonconformance();
        nc.setNcNumber(sequenceGenerator.generateNumber("NONCONFORMANCE"));
        nc.setTitle((String) request.get("title"));
        nc.setDescription((String) request.get("description"));
        nc.setNcType((String) request.get("ncType"));
        nc.setPriority((String) request.getOrDefault("priority", "MEDIUM"));

        String ownerId = (String) request.get("ownerId");
        nc.setOwner(userRepository.getReferenceById(UUID.fromString(ownerId)));
        nc.setDepartment(departmentRepository.getReferenceById(UUID.fromString((String) request.get("departmentId"))));
        nc.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString((String) request.get("plantSiteId"))));
        if (request.containsKey("productName")) nc.setProductName((String) request.get("productName"));
        if (request.containsKey("productCode")) nc.setProductCode((String) request.get("productCode"));
        if (request.containsKey("batchNumber")) nc.setBatchNumber((String) request.get("batchNumber"));
        if (request.containsKey("batchSize")) nc.setBatchSize((String) request.get("batchSize"));
        if (request.containsKey("quantityAffected")) nc.setQuantityAffected((String) request.get("quantityAffected"));
        if (request.containsKey("unitOfMeasure")) nc.setUnitOfMeasure((String) request.get("unitOfMeasure"));
        if (request.containsKey("detectedLocation")) nc.setDetectedLocation((String) request.get("detectedLocation"));
        if (request.containsKey("stageDetected")) {
            String stage = (String) request.get("stageDetected");
            nc.setStageDetected(stage != null && !stage.isBlank() ? stage : null);
        }
        if (request.containsKey("supplierId")) {
            nc.setSupplier(supplierRepository.getReferenceById(UUID.fromString((String) request.get("supplierId"))));
        }
        nc.setCreatedBy(currentUser);
        nc.setUpdatedBy(currentUser);

        Nonconformance saved = ncRepository.save(nc);

        // Start Flowable process
        Map<String, Object> vars = new HashMap<>();
        vars.put("recordId", saved.getId().toString());
        vars.put("ncNumber", saved.getNcNumber());
        vars.put("ownerId", ownerId);
        vars.put("ncType", saved.getNcType());
        if (request.containsKey("supplierId")) vars.put("supplierId", (String) request.get("supplierId"));

        String processId = workflowService.startProcess("nonconformanceProcess", saved.getId().toString(), vars);
        saved.setFlowableProcessId(processId);
        saved.setCurrentWorkflowStep("Initial Review");

        // Record workflow steps
        workflowService.recordStep(RECORD_TYPE, saved.getId(), "Identified", WorkflowStepStatus.COMPLETED,
                currentUser, "NC created", 1);
        workflowService.recordStep(RECORD_TYPE, saved.getId(), "Initial Review", WorkflowStepStatus.CURRENT,
                null, null, 2);

        // Audit trail
        auditTrailService.logAction(RECORD_TYPE, saved.getId(), saved.getNcNumber(),
                "CREATED", null, null, "IDENTIFIED", "NC created");

        // Notify owner
        notificationService.send(UUID.fromString(ownerId), "NC Reported",
                "Nonconformance " + saved.getNcNumber() + " has been reported and requires review.",
                NotificationType.TASK_ASSIGNED, RECORD_TYPE, saved.getId(), saved.getNcNumber());

        return toResponse(ncRepository.save(saved));
    }

    @Transactional
    public NonconformanceResponse update(UUID id, Map<String, Object> request) {
        Nonconformance nc = getEntityById(id);
        if (request.containsKey("title")) nc.setTitle((String) request.get("title"));
        if (request.containsKey("description")) nc.setDescription((String) request.get("description"));
        if (request.containsKey("classification")) nc.setClassification((String) request.get("classification"));
        if (request.containsKey("priority")) nc.setPriority((String) request.get("priority"));
        if (request.containsKey("quantityAffected")) nc.setQuantityAffected((String) request.get("quantityAffected"));
        if (request.containsKey("productName")) nc.setProductName((String) request.get("productName"));
        if (request.containsKey("productCode")) nc.setProductCode((String) request.get("productCode"));
        if (request.containsKey("batchNumber")) nc.setBatchNumber((String) request.get("batchNumber"));
        if (request.containsKey("detectedLocation")) nc.setDetectedLocation((String) request.get("detectedLocation"));
        if (request.containsKey("stageDetected")) {
            String stage = (String) request.get("stageDetected");
            nc.setStageDetected(stage != null && !stage.isBlank() ? stage : null);
        }
        if (request.containsKey("rootCause")) nc.setDispositionJustification((String) request.get("rootCause"));
        if (request.containsKey("deviationId")) {
            nc.setDeviation(deviationRepository.getReferenceById(UUID.fromString((String) request.get("deviationId"))));
        }
        if (request.containsKey("capaRequired")) {
            Object val = request.get("capaRequired");
            nc.setCapaRequired(val instanceof Boolean ? (Boolean) val : Boolean.parseBoolean(val.toString()));
        }
        nc.setUpdatedBy(currentUserProvider.getCurrentUser());
        return toResponse(ncRepository.save(nc));
    }

    @Transactional
    public NonconformanceResponse transitionStatus(UUID id, String newStatus, Map<String, Object> params) {
        Nonconformance nc = getEntityById(id);
        String oldStatus = nc.getStatus();
        User currentUser = currentUserProvider.getCurrentUser();
        boolean statusSetInCase = false;

        switch (newStatus) {
            case "UNDER_REVIEW": {
                // Step 1 complete: Initial Review -> Investigation (reviewDecision=VALID)
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("reviewDecision", "VALID");
                workflowService.completeTask(nc.getFlowableProcessId(), "initialReview", taskVars);

                nc.setStatus("UNDER_REVIEW");
                nc.setCurrentWorkflowStep("Investigation");
                statusSetInCase = true;

                workflowService.recordStep(RECORD_TYPE, nc.getId(), "Initial Review", WorkflowStepStatus.COMPLETED,
                        currentUser, "NC classified as " + nc.getClassification(), 2);
                workflowService.recordStep(RECORD_TYPE, nc.getId(), "Investigation", WorkflowStepStatus.CURRENT,
                        nc.getOwner(), null, 3);

                auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                        "CLASSIFIED", "status", oldStatus, "UNDER_REVIEW", null);
                break;
            }

            case "VOID": {
                // Step 1: Review decision = VOID
                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("reviewDecision", "VOID");
                workflowService.completeTask(nc.getFlowableProcessId(), "initialReview", taskVars);

                nc.setCurrentWorkflowStep("Voided");

                workflowService.recordStep(RECORD_TYPE, nc.getId(), "Initial Review", WorkflowStepStatus.COMPLETED,
                        currentUser, "NC voided - not a valid nonconformance", 2);
                workflowService.recordStep(RECORD_TYPE, nc.getId(), "Voided", WorkflowStepStatus.COMPLETED,
                        currentUser, "NC voided", 3);

                auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                        "NC_VOIDED", "status", oldStatus, "VOID", null);
                break;
            }

            case "INVESTIGATION_COMPLETE": {
                // Step 2 complete: Investigation -> Disposition Review
                workflowService.completeTask(nc.getFlowableProcessId(), "investigation", new HashMap<>());

                nc.setCurrentWorkflowStep("Disposition Review");

                workflowService.recordStep(RECORD_TYPE, nc.getId(), "Investigation", WorkflowStepStatus.COMPLETED,
                        currentUser, "Investigation completed", 3);
                workflowService.recordStep(RECORD_TYPE, nc.getId(), "Disposition Review", WorkflowStepStatus.CURRENT,
                        null, null, 4);

                auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                        "INVESTIGATION_COMPLETED", "status", oldStatus, "INVESTIGATION_COMPLETE", null);
                break;
            }

            case "DISPOSITION": {
                // Step 3 complete: Disposition Review -> CAPA or Closure
                String dispositionDecision = params != null ? (String) params.get("dispositionDecision") : null;
                String justification = params != null ? (String) params.get("dispositionJustification") : null;
                Boolean capaReq = params != null && params.containsKey("capaRequired") ?
                        Boolean.valueOf(params.get("capaRequired").toString()) : nc.getCapaRequired();

                if (dispositionDecision != null) nc.setDispositionDecision(dispositionDecision);
                if (justification != null) nc.setDispositionJustification(justification);
                nc.setDispositionDate(Instant.now());
                nc.setDispositionApprovedBy(currentUser);
                nc.setCapaRequired(capaReq);

                Map<String, Object> taskVars = new HashMap<>();
                taskVars.put("capaRequired", capaReq);
                taskVars.put("dispositionDecision", dispositionDecision != null ? dispositionDecision : "USE_AS_IS");
                workflowService.completeTask(nc.getFlowableProcessId(), "dispositionReview", taskVars);

                if (Boolean.TRUE.equals(capaReq)) {
                    nc.setStatus("CAPA_PENDING");
                    nc.setCurrentWorkflowStep("CAPA Initiation");
                    statusSetInCase = true;

                    workflowService.recordStep(RECORD_TYPE, nc.getId(), "Disposition Review", WorkflowStepStatus.COMPLETED,
                            currentUser, "Disposition: " + dispositionDecision + ". CAPA required.", 4);
                    workflowService.recordStep(RECORD_TYPE, nc.getId(), "CAPA Initiation", WorkflowStepStatus.CURRENT,
                            null, null, 5);
                } else {
                    nc.setStatus("PENDING_CLOSURE");
                    nc.setCurrentWorkflowStep("Closure Review");
                    statusSetInCase = true;

                    workflowService.recordStep(RECORD_TYPE, nc.getId(), "Disposition Review", WorkflowStepStatus.COMPLETED,
                            currentUser, "Disposition: " + dispositionDecision + ". No CAPA needed.", 4);
                    workflowService.recordStep(RECORD_TYPE, nc.getId(), "Closure Review", WorkflowStepStatus.CURRENT,
                            null, null, 6);
                }

                auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                        "DISPOSITION_DECIDED", "dispositionDecision", null, dispositionDecision, null);
                break;
            }

            case "PENDING_CLOSURE": {
                // Step 4a complete: CAPA Initiation -> Closure Review
                workflowService.completeTask(nc.getFlowableProcessId(), "capaInitiation", new HashMap<>());

                nc.setCurrentWorkflowStep("Closure Review");

                workflowService.recordStep(RECORD_TYPE, nc.getId(), "CAPA Initiation", WorkflowStepStatus.COMPLETED,
                        currentUser, "CAPA initiated", 5);
                workflowService.recordStep(RECORD_TYPE, nc.getId(), "Closure Review", WorkflowStepStatus.CURRENT,
                        null, null, 6);

                auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                        "STATUS_CHANGE", "status", oldStatus, "PENDING_CLOSURE", null);
                break;
            }

            case "CLOSED": {
                // Step 5 complete: Final Review and Closure
                workflowService.completeTask(nc.getFlowableProcessId(), "closureReview", new HashMap<>());

                nc.setClosedDate(Instant.now());
                nc.setCurrentWorkflowStep("Closed");

                workflowService.recordStep(RECORD_TYPE, nc.getId(), "Closure Review", WorkflowStepStatus.COMPLETED,
                        currentUser, "NC closed", 6);
                workflowService.recordStep(RECORD_TYPE, nc.getId(), "Closed", WorkflowStepStatus.COMPLETED,
                        currentUser, "NC closed", 7);

                auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                        "STATUS_CHANGE", "status", oldStatus, "CLOSED", null);

                // Notify owner
                notificationService.send(nc.getOwner().getId(), "NC Closed",
                        "Nonconformance " + nc.getNcNumber() + " has been closed.",
                        NotificationType.STATUS_CHANGE, RECORD_TYPE, nc.getId(), nc.getNcNumber());
                break;
            }

            default:
                break;
        }

        if (!statusSetInCase) {
            nc.setStatus(newStatus);
        }
        nc.setUpdatedBy(currentUser);

        auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                "STATUS_CHANGE", "status", oldStatus, nc.getStatus(), null);
        return toResponse(ncRepository.save(nc));
    }

    @Transactional
    public NonconformanceResponse submitDisposition(UUID id, Map<String, Object> request) {
        // Delegate to transitionStatus with DISPOSITION
        Map<String, Object> params = new HashMap<>(request);
        return transitionStatus(id, "DISPOSITION", params);
    }

    @Transactional
    public NonconformanceResponse toggleHold(UUID id, Map<String, Object> request) {
        Nonconformance nc = getEntityById(id);
        String action = (String) request.get("action");
        if ("HOLD".equals(action)) {
            nc.setHoldStatus("HOLD");
            nc.setHoldLocation((String) request.get("holdLocation"));
            nc.setHoldInitiatedDate(Instant.now());
            auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                    "MATERIAL_HELD", "holdStatus", "NONE", "HOLD", null);
        } else {
            nc.setHoldStatus("RELEASED");
            nc.setHoldReleasedDate(Instant.now());
            nc.setHoldReleasedBy(currentUserProvider.getCurrentUser());
            auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                    "HOLD_RELEASED", "holdStatus", "HOLD", "RELEASED", null);
        }
        nc.setUpdatedBy(currentUserProvider.getCurrentUser());
        return toResponse(ncRepository.save(nc));
    }

    @Transactional(readOnly = true)
    public List<WorkflowHistoryResponse> getWorkflowHistory(UUID id) {
        return workflowService.getHistory(RECORD_TYPE, id);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalNonconformances", ncRepository.count());
        m.put("onHold", ncRepository.countOnHold());
        m.put("byStatus", ncRepository.countByStatusGrouped());
        m.put("byType", ncRepository.countByNcType());
        m.put("byDisposition", ncRepository.countByDisposition());
        return m;
    }

    private Nonconformance getEntityById(UUID id) {
        return ncRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Nonconformance not found: " + id));
    }

    private NonconformanceResponse toResponse(Nonconformance nc) {
        return NonconformanceResponse.builder()
                .id(nc.getId())
                .ncNumber(nc.getNcNumber())
                .title(nc.getTitle())
                .description(nc.getDescription())
                .ncType(nc.getNcType())
                .classification(nc.getClassification())
                .status(nc.getStatus())
                .priority(nc.getPriority())
                .productName(nc.getProductName())
                .productCode(nc.getProductCode())
                .batchNumber(nc.getBatchNumber())
                .batchSize(nc.getBatchSize())
                .quantityAffected(nc.getQuantityAffected())
                .unitOfMeasure(nc.getUnitOfMeasure())
                .detectedLocation(nc.getDetectedLocation())
                .stageDetected(nc.getStageDetected())
                .dispositionDecision(nc.getDispositionDecision())
                .dispositionJustification(nc.getDispositionJustification())
                .dispositionApprovedBy(toUserRef(nc.getDispositionApprovedBy()))
                .dispositionDate(nc.getDispositionDate())
                .holdStatus(nc.getHoldStatus())
                .holdLocation(nc.getHoldLocation())
                .holdInitiatedDate(nc.getHoldInitiatedDate())
                .holdReleasedDate(nc.getHoldReleasedDate())
                .holdReleasedBy(toUserRef(nc.getHoldReleasedBy()))
                .capaRequired(nc.getCapaRequired())
                .capaId(nc.getCapa() != null ? nc.getCapa().getId() : null)
                .deviationId(nc.getDeviation() != null ? nc.getDeviation().getId() : null)
                .supplierId(nc.getSupplier() != null ? nc.getSupplier().getId() : null)
                .owner(toUserRef(nc.getOwner()))
                .department(toDepartmentRef(nc.getDepartment()))
                .plantSite(toPlantSiteRef(nc.getPlantSite()))
                .currentWorkflowStep(nc.getCurrentWorkflowStep())
                .flowableProcessId(nc.getFlowableProcessId())
                .closedDate(nc.getClosedDate())
                .createdAt(nc.getCreatedAt())
                .updatedAt(nc.getUpdatedAt())
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
