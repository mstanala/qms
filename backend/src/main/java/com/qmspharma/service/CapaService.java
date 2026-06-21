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
public class CapaService {

    private final CapaRepository capaRepository;
    private final CapaRootCauseAnalysisRepository rcaRepository;
    private final CapaFiveWhyEntryRepository fiveWhyRepository;
    private final CapaFishboneCategoryRepository fishboneRepository;
    private final CapaRiskAssessmentRepository riskAssessmentRepository;
    private final CapaActionRepository actionRepository;
    private final CapaEffectivenessCheckRepository effectivenessCheckRepository;
    private final DeviationRepository deviationRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<CapaResponse> list(List<String> statuses, List<String> priorities, String type,
                                    String sourceType, UUID departmentId, UUID plantSiteId, String search, Pageable pageable) {
        Specification<Capa> spec = Specification.where(null);
        if (statuses != null && !statuses.isEmpty()) {
            var statusEnums = statuses.stream().map(CapaStatus::valueOf).toList();
            spec = spec.and((root, q, cb) -> root.get("status").in(statusEnums));
        }
        if (priorities != null && !priorities.isEmpty()) {
            var prioEnums = priorities.stream().map(CapaPriority::valueOf).toList();
            spec = spec.and((root, q, cb) -> root.get("priority").in(prioEnums));
        }
        if (type != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("type"), CapaType.valueOf(type)));
        if (sourceType != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("sourceType"), CapaSourceType.valueOf(sourceType)));
        if (departmentId != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("department").get("id"), departmentId));
        if (plantSiteId != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("plantSite").get("id"), plantSiteId));
        if (search != null) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("capaNumber")), pattern)));
        }
        return capaRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CapaResponse getById(UUID id) {
        return toResponse(capaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CAPA", "id", id)));
    }

    @Transactional
    public CapaResponse create(CreateCapaRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        Capa capa = new Capa();
        capa.setCapaNumber(sequenceGenerator.generateNumber("CAPA"));
        capa.setTitle(request.getTitle());
        capa.setDescription(request.getDescription());
        capa.setType(CapaType.valueOf(request.getType()));
        capa.setPriority(CapaPriority.valueOf(request.getPriority()));
        capa.setSourceType(CapaSourceType.valueOf(request.getSourceType()));
        capa.setSourceReference(request.getSourceReference());
        capa.setTargetCompletionDate(request.getTargetCompletionDate());
        capa.setDueDate(request.getTargetCompletionDate());
        capa.setInitiator(currentUser);
        capa.setOwner(userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId())));
        capa.setDepartment(departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId())));
        capa.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("PlantSite", "id", request.getPlantSiteId())));
        capa.setProduct(request.getProduct());
        capa.setBatchNumber(request.getBatchNumber());
        if (request.getDeviationId() != null) {
            capa.setDeviation(deviationRepository.findById(request.getDeviationId()).orElse(null));
        }
        capa.setCreatedBy(currentUser);
        capa.setUpdatedBy(currentUser);
        capa = capaRepository.save(capa);

        auditTrailService.logAction("CAPA", capa.getId(), capa.getCapaNumber(), "CREATED", null, null, null, null);
        workflowService.recordStep("CAPA", capa.getId(), "Initiation", WorkflowStepStatus.CURRENT, currentUser, null, 1);
        notificationService.send(capa.getOwner().getId(), "CAPA Assigned",
                "You are the owner of CAPA " + capa.getCapaNumber(),
                NotificationType.TASK_ASSIGNED, "CAPA", capa.getId(), capa.getCapaNumber());
        return toResponse(capa);
    }

    @Transactional
    public CapaResponse update(UUID id, UpdateCapaRequest request) {
        Capa capa = capaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("CAPA", "id", id));
        if (request.getTitle() != null) capa.setTitle(request.getTitle());
        if (request.getDescription() != null) capa.setDescription(request.getDescription());
        if (request.getType() != null) capa.setType(CapaType.valueOf(request.getType()));
        if (request.getPriority() != null) capa.setPriority(CapaPriority.valueOf(request.getPriority()));
        if (request.getTargetCompletionDate() != null) capa.setTargetCompletionDate(request.getTargetCompletionDate());
        if (request.getOwnerId() != null) capa.setOwner(userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId())));
        if (request.getProduct() != null) capa.setProduct(request.getProduct());
        if (request.getBatchNumber() != null) capa.setBatchNumber(request.getBatchNumber());
        capa.setUpdatedBy(currentUserProvider.getCurrentUser());
        auditTrailService.logAction("CAPA", capa.getId(), capa.getCapaNumber(), "UPDATED", null, null, null, null);
        return toResponse(capaRepository.save(capa));
    }

    @Transactional
    public CapaResponse transitionStatus(UUID id, StatusTransitionRequest request) {
        Capa capa = capaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("CAPA", "id", id));
        String oldStatus = capa.getStatus().name();
        CapaStatus newStatus = CapaStatus.valueOf(request.getStatus());
        if (newStatus == CapaStatus.CLOSED) {
            validateClosureRules(capa);
            capa.setClosedAt(Instant.now());
            capa.setActualCompletionDate(Instant.now());
        }
        capa.setStatus(newStatus);
        capa.setCurrentWorkflowStep(newStatus.name());
        capa.setUpdatedBy(currentUserProvider.getCurrentUser());
        capaRepository.save(capa);
        auditTrailService.logAction("CAPA", capa.getId(), capa.getCapaNumber(), "STATUS_CHANGED",
                "status", oldStatus, newStatus.name(), request.getComments());
        return toResponse(capa);
    }

    @Transactional
    public CapaResponse submitRca(UUID id, SubmitRcaRequest request) {
        Capa capa = capaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("CAPA", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();

        CapaRootCauseAnalysis rca = capa.getRootCauseAnalysis() != null ? capa.getRootCauseAnalysis() : new CapaRootCauseAnalysis();
        rca.setCapa(capa);
        rca.setMethod(RcaMethod.valueOf(request.getMethod()));
        rca.setDescription(request.getDescription());
        rca.setRootCauses(request.getRootCauses());
        rca.setContributingFactors(request.getContributingFactors());
        rca.setCompletedBy(currentUser);
        rca.setCompletedDate(Instant.now());
        rca = rcaRepository.save(rca);

        if (request.getFiveWhyEntries() != null) {
            fiveWhyRepository.deleteAll(rca.getFiveWhyEntries());
            for (var entry : request.getFiveWhyEntries()) {
                CapaFiveWhyEntry fwe = new CapaFiveWhyEntry();
                fwe.setRca(rca);
                fwe.setLevel(entry.getLevel());
                fwe.setQuestion(entry.getQuestion());
                fwe.setAnswer(entry.getAnswer());
                fiveWhyRepository.save(fwe);
            }
        }

        if (request.getFishboneCategories() != null) {
            fishboneRepository.deleteAll(rca.getFishboneCategories());
            for (var cat : request.getFishboneCategories()) {
                CapaFishboneCategory fc = new CapaFishboneCategory();
                fc.setRca(rca);
                fc.setCategoryName(cat.getCategoryName());
                fc.setCauses(cat.getCauses());
                fishboneRepository.save(fc);
            }
        }

        capa.setStatus(CapaStatus.ROOT_CAUSE_IDENTIFIED);
        capa.setCurrentWorkflowStep("Root Cause Identified");
        capa.setUpdatedBy(currentUser);
        capaRepository.save(capa);
        auditTrailService.logAction("CAPA", capa.getId(), capa.getCapaNumber(), "RCA_SUBMITTED", null, null, null, null);
        return toResponse(capa);
    }

    @Transactional
    public CapaResponse submitRiskAssessment(UUID id, SubmitRiskAssessmentRequest request) {
        Capa capa = capaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("CAPA", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();

        CapaRiskAssessment ra = new CapaRiskAssessment();
        ra.setCapa(capa);
        ra.setSeverity(request.getSeverity());
        ra.setOccurrence(request.getOccurrence());
        ra.setDetection(request.getDetection());
        ra.setRiskLevel(RiskLevel.valueOf(request.getRiskLevel()));
        ra.setJustification(request.getJustification());
        ra.setAssessedBy(currentUser);
        ra.setAssessedDate(Instant.now());
        riskAssessmentRepository.save(ra);

        auditTrailService.logAction("CAPA", capa.getId(), capa.getCapaNumber(), "RISK_ASSESSMENT_SUBMITTED", null, null, null, null);
        return toResponse(capa);
    }

    @Transactional
    public CapaActionResponse addAction(UUID capaId, CreateCapaActionRequest request) {
        Capa capa = capaRepository.findById(capaId).orElseThrow(() -> new ResourceNotFoundException("CAPA", "id", capaId));
        User assignee = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));

        int actionCount = capa.getActions().size() + 1;
        CapaAction action = new CapaAction();
        action.setCapa(capa);
        action.setActionNumber(capa.getCapaNumber() + "-A" + String.format("%02d", actionCount));
        action.setDescription(request.getDescription());
        action.setType(CapaType.valueOf(request.getType()));
        action.setAssignedTo(assignee);
        action.setDueDate(request.getDueDate());
        action = actionRepository.save(action);

        notificationService.send(assignee.getId(), "CAPA Action Assigned",
                "You have been assigned action " + action.getActionNumber(),
                NotificationType.TASK_ASSIGNED, "CAPA", capaId, capa.getCapaNumber());
        return toActionResponse(action);
    }

    @Transactional
    public CapaActionResponse updateAction(UUID capaId, UUID actionId, UpdateCapaActionRequest request) {
        CapaAction action = actionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("CapaAction", "id", actionId));
        if (request.getDescription() != null) action.setDescription(request.getDescription());
        if (request.getStatus() != null) action.setStatus(ActionStatus.valueOf(request.getStatus()));
        if (request.getAssignedToId() != null) action.setAssignedTo(userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId())));
        if (request.getDueDate() != null) action.setDueDate(request.getDueDate());
        return toActionResponse(actionRepository.save(action));
    }

    @Transactional
    public CapaActionResponse completeAction(UUID capaId, UUID actionId, CompleteActionRequest request) {
        CapaAction action = actionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("CapaAction", "id", actionId));
        action.setStatus(ActionStatus.COMPLETED);
        action.setEvidence(request.getEvidence());
        action.setCompletedDate(request.getCompletedDate() != null ? request.getCompletedDate() : Instant.now());
        return toActionResponse(actionRepository.save(action));
    }

    @Transactional
    public CapaActionResponse verifyAction(UUID capaId, UUID actionId, VerifyActionRequest request) {
        CapaAction action = actionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("CapaAction", "id", actionId));
        if (action.getStatus() != ActionStatus.COMPLETED)
            throw new BusinessRuleException("Action must be completed before verification", "CAPA_ACTION_NOT_COMPLETED");
        action.setStatus(ActionStatus.VERIFIED);
        action.setVerifiedBy(currentUserProvider.getCurrentUser());
        action.setVerifiedDate(Instant.now());
        action.setVerificationComments(request.getVerificationComments());
        return toActionResponse(actionRepository.save(action));
    }

    @Transactional
    public CapaResponse submitEffectivenessCheck(UUID id, SubmitEffectivenessCheckRequest request) {
        Capa capa = capaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("CAPA", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();

        CapaEffectivenessCheck check = new CapaEffectivenessCheck();
        check.setCapa(capa);
        check.setCriteria(request.getCriteria());
        check.setCheckDate(request.getCheckDate());
        check.setResult(EffectivenessResult.valueOf(request.getResult()));
        check.setEvidence(request.getEvidence());
        check.setVerifiedBy(currentUser);
        check.setComments(request.getComments());
        check.setRequiresRecurrence(request.getRequiresRecurrence() != null ? request.getRequiresRecurrence() : false);
        check.setRecurrenceMonths(request.getRecurrenceMonths());
        check.setCheckNumber(capa.getEffectivenessChecks().size() + 1);
        effectivenessCheckRepository.save(check);

        capa.setStatus(CapaStatus.EFFECTIVENESS_CHECK);
        capa.setCurrentWorkflowStep("Effectiveness Check");
        capa.setUpdatedBy(currentUser);
        capaRepository.save(capa);

        auditTrailService.logAction("CAPA", capa.getId(), capa.getCapaNumber(), "EFFECTIVENESS_CHECK_SUBMITTED",
                "result", null, request.getResult(), null);
        return toResponse(capa);
    }

    @Transactional(readOnly = true)
    public List<AuditTrailResponse> getAuditTrail(UUID id) {
        capaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("CAPA", "id", id));
        return auditTrailService.getByRecord("CAPA", id);
    }

    private void validateClosureRules(Capa capa) {
        long unverifiedActions = actionRepository.countByCapaIdAndStatusNot(capa.getId(), ActionStatus.VERIFIED);
        if (unverifiedActions > 0)
            throw new BusinessRuleException("All actions must be verified before closure. " + unverifiedActions + " actions pending.",
                    "CAPA_CLOSE_ACTIONS_INCOMPLETE");
        boolean hasEffective = effectivenessCheckRepository.existsByCapaIdAndResult(capa.getId(), EffectivenessResult.EFFECTIVE);
        if (!hasEffective)
            throw new BusinessRuleException("At least one effectiveness check must be EFFECTIVE", "CAPA_CLOSE_NO_EFFECTIVE_CHECK");
    }

    private UserRef toUserRef(User u) {
        if (u == null) return null;
        return UserRef.builder().id(u.getId()).displayName(u.getDisplayName()).email(u.getEmail()).build();
    }

    private CapaActionResponse toActionResponse(CapaAction a) {
        return CapaActionResponse.builder()
                .id(a.getId()).actionNumber(a.getActionNumber()).description(a.getDescription())
                .type(a.getType().name()).status(a.getStatus().name())
                .assignedTo(toUserRef(a.getAssignedTo())).dueDate(a.getDueDate())
                .completedDate(a.getCompletedDate()).evidence(a.getEvidence())
                .verifiedBy(toUserRef(a.getVerifiedBy())).verifiedDate(a.getVerifiedDate())
                .verificationComments(a.getVerificationComments()).build();
    }

    private CapaResponse toResponse(Capa c) {
        var builder = CapaResponse.builder()
                .id(c.getId()).capaNumber(c.getCapaNumber()).title(c.getTitle())
                .description(c.getDescription()).type(c.getType().name()).status(c.getStatus().name())
                .priority(c.getPriority().name()).sourceType(c.getSourceType().name())
                .sourceReference(c.getSourceReference()).initiatedDate(c.getInitiatedDate())
                .targetCompletionDate(c.getTargetCompletionDate()).actualCompletionDate(c.getActualCompletionDate())
                .dueDate(c.getDueDate()).initiator(toUserRef(c.getInitiator())).owner(toUserRef(c.getOwner()))
                .departmentId(c.getDepartment().getId()).departmentName(c.getDepartment().getName())
                .plantSiteId(c.getPlantSite().getId()).plantSiteName(c.getPlantSite().getName())
                .product(c.getProduct()).batchNumber(c.getBatchNumber())
                .deviationId(c.getDeviation() != null ? c.getDeviation().getId() : null)
                .deviationNumber(c.getDeviation() != null ? c.getDeviation().getDeviationNumber() : null)
                .currentWorkflowStep(c.getCurrentWorkflowStep())
                .createdAt(c.getCreatedAt()).updatedAt(c.getUpdatedAt()).version(c.getVersion());

        if (c.getRootCauseAnalysis() != null) {
            var rca = c.getRootCauseAnalysis();
            var fiveWhys = rca.getFiveWhyEntries() != null ? rca.getFiveWhyEntries().stream()
                    .map(e -> RcaResponse.FiveWhyEntryResponse.builder()
                            .level(e.getLevel()).question(e.getQuestion()).answer(e.getAnswer()).build())
                    .collect(Collectors.toList()) : null;
            var fishbone = rca.getFishboneCategories() != null ? rca.getFishboneCategories().stream()
                    .map(f -> RcaResponse.FishboneCategoryResponse.builder()
                            .categoryName(f.getCategoryName()).causes(f.getCauses()).build())
                    .collect(Collectors.toList()) : null;
            builder.rootCauseAnalysis(RcaResponse.builder()
                    .id(rca.getId()).method(rca.getMethod().name()).description(rca.getDescription())
                    .rootCauses(rca.getRootCauses()).contributingFactors(rca.getContributingFactors())
                    .fiveWhyEntries(fiveWhys).fishboneCategories(fishbone)
                    .completedDate(rca.getCompletedDate()).completedBy(toUserRef(rca.getCompletedBy())).build());
        }

        if (c.getRiskAssessment() != null) {
            var ra = c.getRiskAssessment();
            builder.riskAssessment(RiskAssessmentResponse.builder()
                    .id(ra.getId()).severity(ra.getSeverity()).occurrence(ra.getOccurrence())
                    .detection(ra.getDetection()).rpn(ra.getRpn()).riskLevel(ra.getRiskLevel().name())
                    .justification(ra.getJustification()).assessedBy(toUserRef(ra.getAssessedBy()))
                    .assessedDate(ra.getAssessedDate()).build());
        }

        if (c.getActions() != null) {
            builder.actions(c.getActions().stream().map(this::toActionResponse).collect(Collectors.toList()));
        }

        if (c.getEffectivenessChecks() != null) {
            builder.effectivenessChecks(c.getEffectivenessChecks().stream()
                    .map(ec -> EffectivenessCheckResponse.builder()
                            .id(ec.getId()).criteria(ec.getCriteria()).checkDate(ec.getCheckDate())
                            .result(ec.getResult().name()).evidence(ec.getEvidence())
                            .verifiedBy(toUserRef(ec.getVerifiedBy())).comments(ec.getComments())
                            .requiresRecurrence(ec.getRequiresRecurrence()).recurrenceMonths(ec.getRecurrenceMonths())
                            .nextCheckDate(ec.getNextCheckDate()).checkNumber(ec.getCheckNumber()).build())
                    .collect(Collectors.toList()));
        }
        return builder.build();
    }
}
