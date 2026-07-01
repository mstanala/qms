package com.qmspharma.service;

import com.qmspharma.exception.*;
import com.qmspharma.model.dto.request.*;
import com.qmspharma.model.dto.response.*;
import com.qmspharma.model.entity.*;
import com.qmspharma.model.enums.*;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeviationService {

    private static final String PROCESS_KEY = "deviationProcess";
    private static final String RECORD_TYPE = "DEVIATION";

    private final DeviationRepository deviationRepository;
    private final DeviationInvestigationRepository investigationRepository;
    private final DeviationImpactAssessmentRepository impactAssessmentRepository;
    private final DeviationDispositionRepository dispositionRepository;
    private final DeviationAffectedBatchRepository affectedBatchRepository;
    private final DeviationImmediateActionRepository immediateActionRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<DeviationResponse> list(List<String> statuses, List<String> classifications, List<String> categories,
                                         String type, UUID departmentId, UUID plantSiteId, String search, Pageable pageable) {
        Specification<Deviation> spec = Specification.where(null);
        if (statuses != null && !statuses.isEmpty()) {
            var statusEnums = statuses.stream().map(DeviationStatus::valueOf).toList();
            spec = spec.and((root, q, cb) -> root.get("status").in(statusEnums));
        }
        if (classifications != null && !classifications.isEmpty()) {
            var classEnums = classifications.stream().map(DeviationClassification::valueOf).toList();
            spec = spec.and((root, q, cb) -> root.get("classification").in(classEnums));
        }
        if (type != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("type"), DeviationType.valueOf(type)));
        if (departmentId != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("department").get("id"), departmentId));
        if (plantSiteId != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("plantSite").get("id"), plantSiteId));
        if (search != null) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("deviationNumber")), pattern)));
        }
        return deviationRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public DeviationResponse getById(UUID id) {
        return toResponse(deviationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id)));
    }

    @Transactional
    public DeviationResponse create(CreateDeviationRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        Deviation dev = new Deviation();
        dev.setDeviationNumber(sequenceGenerator.generateNumber("DEVIATION"));
        dev.setTitle(request.getTitle());
        dev.setDescription(request.getDescription());
        dev.setType(DeviationType.valueOf(request.getType()));
        dev.setCategory(DeviationCategory.valueOf(request.getCategory()));
        dev.setOccurredDate(request.getOccurredDate());
        dev.setDetectedDate(request.getDetectedDate());
        dev.setReportedDate(Instant.now());
        dev.setTargetClosureDate(request.getTargetClosureDate());
        dev.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("PlantSite", "id", request.getPlantSiteId())));
        dev.setDepartment(departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId())));
        dev.setReportedBy(currentUser);
        dev.setArea(request.getArea());
        dev.setEquipment(request.getEquipment());
        dev.setProduct(request.getProduct());
        dev.setBatchNumber(request.getBatchNumber());
        dev.setBatchSize(request.getBatchSize());
        dev.setGmpImpact(request.getGmpImpact() != null ? request.getGmpImpact() : false);
        dev.setPatientSafetyImpact(request.getPatientSafetyImpact() != null ? request.getPatientSafetyImpact() : false);
        dev.setRegulatoryImpact(request.getRegulatoryImpact() != null ? request.getRegulatoryImpact() : false);
        dev.setSourceArea(request.getSourceArea());
        dev.setCreatedBy(currentUser);
        dev.setUpdatedBy(currentUser);

        dev = deviationRepository.save(dev);

        if (request.getAffectedBatches() != null) {
            for (String batch : request.getAffectedBatches()) {
                DeviationAffectedBatch ab = new DeviationAffectedBatch();
                ab.setDeviation(dev);
                ab.setBatchNumber(batch);
                affectedBatchRepository.save(ab);
            }
        }

        // Start Flowable process
        Map<String, Object> vars = new HashMap<>();
        vars.put("recordId", dev.getId().toString());
        vars.put("deviationNumber", dev.getDeviationNumber());
        vars.put("reportedById", currentUser.getId().toString());
        vars.put("plantSiteId", dev.getPlantSite().getId().toString());
        vars.put("departmentId", dev.getDepartment().getId().toString());
        vars.put("targetClosureDate", dev.getTargetClosureDate().toString());
        vars.put("capaRequired", false);

        String processId = workflowService.startProcess(PROCESS_KEY, dev.getId().toString(), vars);
        dev.setFlowableProcessId(processId);
        dev = deviationRepository.save(dev);

        auditTrailService.logAction(RECORD_TYPE, dev.getId(), dev.getDeviationNumber(), "CREATED", null, null, null, null);
        workflowService.recordStep(RECORD_TYPE, dev.getId(), "Reported", WorkflowStepStatus.CURRENT, currentUser, null, 1);

        return toResponse(dev);
    }

    @Transactional
    public DeviationResponse update(UUID id, UpdateDeviationRequest request) {
        Deviation dev = deviationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id));
        if (request.getTitle() != null) dev.setTitle(request.getTitle());
        if (request.getDescription() != null) dev.setDescription(request.getDescription());
        if (request.getType() != null) dev.setType(DeviationType.valueOf(request.getType()));
        if (request.getCategory() != null) dev.setCategory(DeviationCategory.valueOf(request.getCategory()));
        if (request.getClassification() != null) dev.setClassification(DeviationClassification.valueOf(request.getClassification()));
        if (request.getSourceArea() != null) dev.setSourceArea(request.getSourceArea());
        if (request.getOccurredDate() != null) dev.setOccurredDate(request.getOccurredDate());
        if (request.getDetectedDate() != null) dev.setDetectedDate(request.getDetectedDate());
        if (request.getTargetClosureDate() != null) dev.setTargetClosureDate(request.getTargetClosureDate());
        if (request.getPlantSiteId() != null) {
            PlantSite plantSite = plantSiteRepository.findById(request.getPlantSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("PlantSite", "id", request.getPlantSiteId()));
            dev.setPlantSite(plantSite);
        }
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
            dev.setDepartment(department);
        }
        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            dev.setAssignedTo(assignee);
        }
        if (request.getArea() != null) dev.setArea(request.getArea());
        if (request.getEquipment() != null) dev.setEquipment(request.getEquipment());
        if (request.getProduct() != null) dev.setProduct(request.getProduct());
        if (request.getBatchNumber() != null) dev.setBatchNumber(request.getBatchNumber());
        if (request.getGmpImpact() != null) dev.setGmpImpact(request.getGmpImpact());
        if (request.getPatientSafetyImpact() != null) dev.setPatientSafetyImpact(request.getPatientSafetyImpact());
        if (request.getRegulatoryImpact() != null) dev.setRegulatoryImpact(request.getRegulatoryImpact());
        dev.setUpdatedBy(currentUserProvider.getCurrentUser());
        auditTrailService.logAction(RECORD_TYPE, dev.getId(), dev.getDeviationNumber(), "UPDATED", null, null, null, null);
        return toResponse(deviationRepository.save(dev));
    }

    @Transactional
    public DeviationResponse classify(UUID id, ClassifyDeviationRequest request) {
        Deviation dev = deviationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();
        requireActiveRole(currentUser, "QA_REVIEWER", "Deviation QA review and classification");
        String oldClassification = dev.getClassification() != null ? dev.getClassification().name() : null;

        dev.setClassification(DeviationClassification.valueOf(request.getClassification()));
        dev.setStatus(DeviationStatus.CLASSIFIED);
        dev.setCurrentWorkflowStep("Classified");
        dev.setUpdatedBy(currentUser);

        // Complete QA Review task in Flowable
        Map<String, Object> taskVars = new HashMap<>();
        taskVars.put("classification", request.getClassification());
        taskVars.put("assignedToId", request.getAssignedToId() != null ? request.getAssignedToId().toString() : null);
        workflowService.completeTask(dev.getFlowableProcessId(), "qaReview", taskVars);

        // Assign investigator if provided
        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            dev.setAssignedTo(assignee);
        }

        auditTrailService.logAction(RECORD_TYPE, dev.getId(), dev.getDeviationNumber(), "CLASSIFIED",
                "classification", oldClassification, request.getClassification(), request.getComments());
        workflowService.recordStep(RECORD_TYPE, dev.getId(), "QA Review & Classification",
                WorkflowStepStatus.COMPLETED, currentUser, request.getComments(), 2);
        workflowService.recordStep(RECORD_TYPE, dev.getId(), "Investigation",
                WorkflowStepStatus.CURRENT, dev.getAssignedTo(), null, 3);

        return toResponse(deviationRepository.save(dev));
    }

    @Transactional
    public DeviationResponse assign(UUID id, AssignInvestigatorRequest request) {
        Deviation dev = deviationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id));
        User assignee = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
        dev.setAssignedTo(assignee);
        dev.setUpdatedBy(currentUserProvider.getCurrentUser());

        // Update Flowable process variable for assignee
        if (dev.getFlowableProcessId() != null) {
            try {
                workflowService.updateProcessVariable(dev.getFlowableProcessId(), "assignedToId", assignee.getId().toString());
            } catch (Exception ignored) {}
        }

        auditTrailService.logAction(RECORD_TYPE, dev.getId(), dev.getDeviationNumber(), "ASSIGNED",
                "assigned_to", null, assignee.getDisplayName(), request.getComments());
        notificationService.send(assignee.getId(), "Deviation Assigned",
                "You have been assigned to deviation " + dev.getDeviationNumber(),
                NotificationType.TASK_ASSIGNED, RECORD_TYPE, dev.getId(), dev.getDeviationNumber());
        return toResponse(deviationRepository.save(dev));
    }

    @Transactional
    public DeviationResponse submitInvestigation(UUID id, SubmitInvestigationRequest request) {
        Deviation dev = deviationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id));
        User investigator = userRepository.findById(request.getInvestigatorId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getInvestigatorId()));

        DeviationInvestigation inv = dev.getInvestigation() != null ? dev.getInvestigation() : new DeviationInvestigation();
        inv.setDeviation(dev);
        inv.setInvestigator(investigator);
        inv.setProbableCause(request.getProbableCause());
        inv.setRootCause(request.getRootCause());
        inv.setFindings(request.getFindings());
        inv.setConclusion(request.getConclusion());
        inv.setMethod(request.getMethod());
        inv.setCompletedDate(Instant.now());
        inv = investigationRepository.save(inv);

        if (request.getImmediateActions() != null) {
            immediateActionRepository.deleteAll(inv.getImmediateActions());
            int order = 0;
            for (String actionDesc : request.getImmediateActions()) {
                DeviationImmediateAction action = new DeviationImmediateAction();
                action.setInvestigation(inv);
                action.setActionDescription(actionDesc);
                action.setActionOrder(order++);
                immediateActionRepository.save(action);
            }
        }

        dev.setStatus(DeviationStatus.INVESTIGATION);
        dev.setCurrentWorkflowStep("Investigation Complete");
        dev.setUpdatedBy(currentUserProvider.getCurrentUser());
        deviationRepository.save(dev);

        try {
            workflowService.completeTask(dev.getFlowableProcessId(), "investigation", null);
        } catch (Exception ignored) {}

        auditTrailService.logAction(RECORD_TYPE, dev.getId(), dev.getDeviationNumber(), "INVESTIGATION_SUBMITTED", null, null, null, null);
        workflowService.recordStep(RECORD_TYPE, dev.getId(), "Investigation",
                WorkflowStepStatus.COMPLETED, investigator, "Investigation completed", 3);
        workflowService.recordStep(RECORD_TYPE, dev.getId(), "Impact Assessment",
                WorkflowStepStatus.CURRENT, null, null, 4);
        return toResponse(dev);
    }

    @Transactional
    public DeviationResponse submitImpactAssessment(UUID id, SubmitImpactAssessmentRequest request) {
        Deviation dev = deviationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();

        DeviationImpactAssessment ia = dev.getImpactAssessment() != null ? dev.getImpactAssessment() : new DeviationImpactAssessment();
        ia.setDeviation(dev);
        ia.setProductQualityImpact(ImpactLevel.valueOf(request.getProductQualityImpact()));
        ia.setPatientSafetyImpact(ImpactLevel.valueOf(request.getPatientSafetyImpact()));
        ia.setRegulatoryImpact(ImpactLevel.valueOf(request.getRegulatoryImpact()));
        ia.setBusinessImpact(ImpactLevel.valueOf(request.getBusinessImpact()));
        ia.setOverallRiskLevel(RiskLevel.valueOf(request.getOverallRiskLevel()));
        ia.setAffectedProducts(request.getAffectedProducts() != null ? request.getAffectedProducts().toArray(new String[0]) : null);
        ia.setAffectedBatches(request.getAffectedBatches() != null ? request.getAffectedBatches().toArray(new String[0]) : null);
        ia.setBatchDisposition(request.getBatchDisposition());
        ia.setJustification(request.getJustification());
        ia.setAssessedBy(currentUser);
        ia.setAssessedDate(Instant.now());
        impactAssessmentRepository.save(ia);

        dev.setStatus(DeviationStatus.IMPACT_ASSESSMENT);
        dev.setCurrentWorkflowStep("Impact Assessment Complete");
        dev.setUpdatedBy(currentUser);
        deviationRepository.save(dev);

        try {
            workflowService.completeTask(dev.getFlowableProcessId(), "impactAssessment", null);
        } catch (Exception ignored) {}

        auditTrailService.logAction(RECORD_TYPE, dev.getId(), dev.getDeviationNumber(), "IMPACT_ASSESSMENT_SUBMITTED", null, null, null, null);
        workflowService.recordStep(RECORD_TYPE, dev.getId(), "Impact Assessment",
                WorkflowStepStatus.COMPLETED, currentUser, null, 4);
        workflowService.recordStep(RECORD_TYPE, dev.getId(), "Disposition",
                WorkflowStepStatus.CURRENT, null, null, 5);
        return toResponse(dev);
    }

    @Transactional
    public DeviationResponse submitDisposition(UUID id, SubmitDispositionRequest request) {
        Deviation dev = deviationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();
        requireActiveRole(currentUser, "QA_APPROVER", "Deviation disposition approval");

        DeviationDisposition disp = dev.getDisposition() != null ? dev.getDisposition() : new DeviationDisposition();
        disp.setDeviation(dev);
        disp.setDecision(DispositionDecision.valueOf(request.getDecision()));
        disp.setJustification(request.getJustification());
        disp.setConditions(request.getConditions());
        disp.setQaReviewComments(request.getQaReviewComments());
        disp.setApprovedBy(currentUser);
        disp.setApprovedDate(Instant.now());
        dispositionRepository.save(disp);

        boolean capaRequired = request.getCapaRequired() != null ? request.getCapaRequired() : false;
        dev.setCapaRequired(capaRequired);
        dev.setStatus(DeviationStatus.DISPOSITION);
        dev.setCurrentWorkflowStep("Disposition");
        dev.setUpdatedBy(currentUser);
        deviationRepository.save(dev);

        Map<String, Object> taskVars = new HashMap<>();
        taskVars.put("capaRequired", capaRequired);
        try {
            workflowService.completeTask(dev.getFlowableProcessId(), "disposition", taskVars);
        } catch (Exception ignored) {}

        auditTrailService.logAction(RECORD_TYPE, dev.getId(), dev.getDeviationNumber(), "DISPOSITION_SUBMITTED",
                "decision", null, request.getDecision(), null);
        workflowService.recordStep(RECORD_TYPE, dev.getId(), "Disposition",
                WorkflowStepStatus.COMPLETED, currentUser, null, 5);

        if (capaRequired) {
            workflowService.recordStep(RECORD_TYPE, dev.getId(), "CAPA Initiation",
                    WorkflowStepStatus.CURRENT, null, "CAPA required", 6);
        } else {
            workflowService.recordStep(RECORD_TYPE, dev.getId(), "Pending Closure",
                    WorkflowStepStatus.CURRENT, null, null, 7);
        }
        return toResponse(dev);
    }

    @Transactional
    public DeviationResponse transitionStatus(UUID id, StatusTransitionRequest request) {
        Deviation dev = deviationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id));
        String oldStatus = dev.getStatus().name();
        DeviationStatus newStatus = DeviationStatus.valueOf(request.getStatus());
        User currentUser = currentUserProvider.getCurrentUser();

        switch (newStatus) {
            case UNDER_REVIEW:
                // REPORTED → UNDER_REVIEW
                workflowService.recordStep(RECORD_TYPE, dev.getId(), "Reported",
                        WorkflowStepStatus.COMPLETED, currentUser, null, 1);
                workflowService.recordStep(RECORD_TYPE, dev.getId(), "QA Review & Classification",
                        WorkflowStepStatus.CURRENT, null, null, 2);
                dev.setCurrentWorkflowStep("QA Review & Classification");
                break;

            case CLASSIFIED:
                dev.setCurrentWorkflowStep("Classified");
                break;

            case INVESTIGATION:
                // CLASSIFIED → INVESTIGATION
                workflowService.recordStep(RECORD_TYPE, dev.getId(), "Investigation",
                        WorkflowStepStatus.CURRENT, null, null, 3);
                dev.setCurrentWorkflowStep("Investigation");
                break;

            case IMPACT_ASSESSMENT:
                // INVESTIGATION → IMPACT_ASSESSMENT
                if (dev.getInvestigation() == null) {
                    throw new BusinessRuleException(
                            "Investigation must be submitted before advancing to Impact Assessment",
                            "DEV_NO_INVESTIGATION");
                }
                try {
                    workflowService.completeTask(dev.getFlowableProcessId(), "investigation", null);
                } catch (Exception ignored) {}
                dev.setCurrentWorkflowStep("Impact Assessment");
                break;

            case DISPOSITION:
                // IMPACT_ASSESSMENT → DISPOSITION
                if (dev.getImpactAssessment() == null) {
                    throw new BusinessRuleException(
                            "Impact assessment must be submitted before advancing to Disposition",
                            "DEV_NO_IMPACT_ASSESSMENT");
                }
                try {
                    workflowService.completeTask(dev.getFlowableProcessId(), "impactAssessment", null);
                } catch (Exception ignored) {}
                dev.setCurrentWorkflowStep("Disposition");
                break;

            case CAPA_INITIATED:
                // DISPOSITION → CAPA_INITIATED
                workflowService.recordStep(RECORD_TYPE, dev.getId(), "CAPA Initiation",
                        WorkflowStepStatus.CURRENT, null, "CAPA required", 6);
                dev.setCurrentWorkflowStep("CAPA Initiation");
                break;

            case PENDING_CLOSURE:
                // CAPA_INITIATED → PENDING_CLOSURE (or DISPOSITION → PENDING_CLOSURE)
                try {
                    workflowService.completeTask(dev.getFlowableProcessId(), "capaInitiation", null);
                } catch (Exception ignored) {}
                if (dev.getStatus() == DeviationStatus.CAPA_INITIATED) {
                    workflowService.recordStep(RECORD_TYPE, dev.getId(), "CAPA Initiation",
                            WorkflowStepStatus.COMPLETED, currentUser, null, 6);
                }
                workflowService.recordStep(RECORD_TYPE, dev.getId(), "Pending Closure",
                        WorkflowStepStatus.CURRENT, null, null, 7);
                dev.setCurrentWorkflowStep("Pending Closure");
                break;

            case CLOSED:
                // PENDING_CLOSURE → CLOSED
                validateClosureRules(dev);
                dev.setActualClosureDate(Instant.now());
                workflowService.completeCurrentTask(dev.getFlowableProcessId(), null);
                workflowService.recordStep(RECORD_TYPE, dev.getId(), "Pending Closure",
                        WorkflowStepStatus.COMPLETED, currentUser, null, 7);
                workflowService.recordStep(RECORD_TYPE, dev.getId(), "Closed",
                        WorkflowStepStatus.COMPLETED, currentUser, null, 8);
                dev.setCurrentWorkflowStep("Closed");
                break;

            case REJECTED:
                // Any → REJECTED
                try {
                    workflowService.completeCurrentTask(dev.getFlowableProcessId(), null);
                } catch (Exception ignored) {}
                dev.setCurrentWorkflowStep("Rejected");
                break;

            default:
                dev.setCurrentWorkflowStep(newStatus.name());
                break;
        }

        dev.setStatus(newStatus);
        dev.setUpdatedBy(currentUser);
        deviationRepository.save(dev);

        auditTrailService.logAction(RECORD_TYPE, dev.getId(), dev.getDeviationNumber(), "STATUS_CHANGED",
                "status", oldStatus, newStatus.name(), request.getComments());
        return toResponse(dev);
    }

    private void validateClosureRules(Deviation dev) {
        if (dev.getInvestigation() == null)
            throw new BusinessRuleException("Investigation must be completed before closure", "DEV_CLOSE_NO_INVESTIGATION");
        if (dev.getImpactAssessment() == null)
            throw new BusinessRuleException("Impact assessment must be submitted before closure", "DEV_CLOSE_NO_IMPACT");
        if (dev.getDisposition() == null)
            throw new BusinessRuleException("Disposition must be recorded before closure", "DEV_CLOSE_NO_DISPOSITION");
        if (dev.getCapaRequired() && dev.getCapaId() == null)
            throw new BusinessRuleException("CAPA is required but not linked", "DEV_CLOSE_NO_CAPA");
    }

    private void requireActiveRole(User user, String requiredRoleCode, String action) {
        Instant now = Instant.now();
        boolean hasRole = user.getUserRoles() != null && user.getUserRoles().stream()
                .filter(userRole -> Boolean.TRUE.equals(userRole.getIsActive()))
                .filter(userRole -> userRole.getValidFrom() == null || !userRole.getValidFrom().isAfter(now))
                .filter(userRole -> userRole.getValidUntil() == null || userRole.getValidUntil().isAfter(now))
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .anyMatch(role -> requiredRoleCode.equals(role.getCode()) && Boolean.TRUE.equals(role.getIsActive()));
        if (!hasRole) {
            throw new ForbiddenException(action + " requires " + requiredRoleCode + " role");
        }
    }

    @Transactional(readOnly = true)
    public List<AuditTrailResponse> getAuditTrail(UUID id) {
        deviationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id));
        return auditTrailService.getByRecord(RECORD_TYPE, id);
    }

    @Transactional(readOnly = true)
    public List<WorkflowHistoryResponse> getWorkflowHistory(UUID id) {
        deviationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Deviation", "id", id));
        return workflowService.getHistory(RECORD_TYPE, id);
    }

    private UserRef toUserRef(User u) {
        if (u == null) return null;
        return UserRef.builder().id(u.getId()).displayName(u.getDisplayName()).email(u.getEmail()).build();
    }

    private DeviationResponse toResponse(Deviation d) {
        var builder = DeviationResponse.builder()
                .id(d.getId()).deviationNumber(d.getDeviationNumber()).title(d.getTitle())
                .description(d.getDescription()).type(d.getType().name()).category(d.getCategory().name())
                .classification(d.getClassification() != null ? d.getClassification().name() : null)
                .status(d.getStatus().name()).sourceArea(d.getSourceArea())
                .occurredDate(d.getOccurredDate()).reportedDate(d.getReportedDate())
                .detectedDate(d.getDetectedDate()).targetClosureDate(d.getTargetClosureDate())
                .actualClosureDate(d.getActualClosureDate())
                .reportedBy(toUserRef(d.getReportedBy())).assignedTo(toUserRef(d.getAssignedTo()))
                .reviewer(toUserRef(d.getReviewer())).approvedBy(toUserRef(d.getApprovedBy()))
                .plantSiteId(d.getPlantSite().getId()).plantSiteName(d.getPlantSite().getName())
                .departmentId(d.getDepartment().getId()).departmentName(d.getDepartment().getName())
                .area(d.getArea()).equipment(d.getEquipment()).product(d.getProduct())
                .batchNumber(d.getBatchNumber()).batchSize(d.getBatchSize())
                .gmpImpact(d.getGmpImpact()).patientSafetyImpact(d.getPatientSafetyImpact())
                .regulatoryImpact(d.getRegulatoryImpact()).capaRequired(d.getCapaRequired())
                .capaId(d.getCapaId()).currentWorkflowStep(d.getCurrentWorkflowStep())
                .createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt()).version(d.getVersion());

        if (d.getAffectedBatches() != null) {
            builder.affectedBatches(d.getAffectedBatches().stream()
                    .map(ab -> AffectedBatchResponse.builder()
                            .id(ab.getId()).batchNumber(ab.getBatchNumber()).productName(ab.getProductName())
                            .batchSize(ab.getBatchSize()).impactDescription(ab.getImpactDescription())
                            .disposition(ab.getDisposition() != null ? ab.getDisposition().name() : null).build())
                    .collect(Collectors.toList()));
        }

        if (d.getInvestigation() != null) {
            var inv = d.getInvestigation();
            var actions = inv.getImmediateActions() != null ? inv.getImmediateActions().stream()
                    .map(DeviationImmediateAction::getActionDescription).collect(Collectors.toList()) : null;
            builder.investigation(InvestigationResponse.builder()
                    .id(inv.getId()).investigator(toUserRef(inv.getInvestigator()))
                    .startDate(inv.getStartDate()).completedDate(inv.getCompletedDate())
                    .probableCause(inv.getProbableCause()).rootCause(inv.getRootCause())
                    .findings(inv.getFindings()).conclusion(inv.getConclusion())
                    .method(inv.getMethod()).immediateActions(actions).build());
        }

        if (d.getImpactAssessment() != null) {
            var ia = d.getImpactAssessment();
            builder.impactAssessment(ImpactAssessmentResponse.builder()
                    .id(ia.getId()).productQualityImpact(ia.getProductQualityImpact().name())
                    .patientSafetyImpact(ia.getPatientSafetyImpact().name())
                    .regulatoryImpact(ia.getRegulatoryImpact().name())
                    .businessImpact(ia.getBusinessImpact().name())
                    .overallRiskLevel(ia.getOverallRiskLevel().name())
                    .affectedProducts(ia.getAffectedProducts() != null ? java.util.Arrays.asList(ia.getAffectedProducts()) : null).affectedBatches(ia.getAffectedBatches() != null ? java.util.Arrays.asList(ia.getAffectedBatches()) : null)
                    .batchDisposition(ia.getBatchDisposition()).justification(ia.getJustification())
                    .assessedBy(toUserRef(ia.getAssessedBy())).assessedDate(ia.getAssessedDate()).build());
        }

        if (d.getDisposition() != null) {
            var disp = d.getDisposition();
            builder.disposition(DispositionResponse.builder()
                    .id(disp.getId()).decision(disp.getDecision().name())
                    .justification(disp.getJustification()).conditions(disp.getConditions())
                    .approvedBy(toUserRef(disp.getApprovedBy())).approvedDate(disp.getApprovedDate())
                    .qaReviewComments(disp.getQaReviewComments()).build());
        }

        return builder.build();
    }
}
