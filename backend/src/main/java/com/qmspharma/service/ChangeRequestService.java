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
public class ChangeRequestService {

    private final ChangeRequestRepository changeRequestRepository;
    private final ChangeImpactAssessmentRepository impactRepository;
    private final ChangeRegulatoryFilingRepository filingRepository;
    private final ChangeAffectedDocumentRepository affectedDocRepository;
    private final ChangeAffectedProductRepository affectedProductRepository;
    private final ChangeImplementationTaskRepository taskRepository;
    private final ChangeTrainingRequirementRepository trainingRepository;
    private final ChangeApprovalRepository approvalRepository;
    private final ChangeEffectivenessReviewRepository reviewRepository;
    private final ChangeEffectivenessCriteriaRepository criteriaRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<ChangeRequestResponse> list(List<String> statuses, List<String> classifications, List<String> types,
                                             List<String> priorities, UUID departmentId, UUID plantSiteId,
                                             String search, Pageable pageable) {
        Specification<ChangeRequest> spec = Specification.where(null);
        if (statuses != null && !statuses.isEmpty())
            spec = spec.and((r, q, cb) -> r.get("status").in(statuses.stream().map(ChangeStatus::valueOf).toList()));
        if (classifications != null && !classifications.isEmpty())
            spec = spec.and((r, q, cb) -> r.get("classification").in(classifications.stream().map(ChangeClassification::valueOf).toList()));
        if (types != null && !types.isEmpty())
            spec = spec.and((r, q, cb) -> r.get("type").in(types.stream().map(ChangeType::valueOf).toList()));
        if (departmentId != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("department").get("id"), departmentId));
        if (plantSiteId != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("plantSite").get("id"), plantSiteId));
        if (search != null) {
            String p = "%" + search.toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.or(cb.like(cb.lower(r.get("title")), p), cb.like(cb.lower(r.get("changeNumber")), p)));
        }
        return changeRequestRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ChangeRequestResponse getById(UUID id) {
        return toResponse(changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id)));
    }

    @Transactional
    public ChangeRequestResponse create(CreateChangeRequestRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        ChangeRequest cr = new ChangeRequest();
        cr.setChangeNumber(sequenceGenerator.generateNumber("CHANGE_CONTROL"));
        cr.setTitle(request.getTitle());
        cr.setDescription(request.getDescription());
        cr.setJustification(request.getJustification());
        cr.setType(ChangeType.valueOf(request.getType()));
        cr.setCategory(ChangeCategory.valueOf(request.getCategory()));
        cr.setClassification(ChangeClassification.valueOf(request.getClassification()));
        cr.setPriority(ChangePriority.valueOf(request.getPriority()));
        cr.setRequestedBy(currentUser);
        cr.setDepartment(departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId())));
        cr.setChangeOwner(userRepository.findById(request.getChangeOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getChangeOwnerId())));
        cr.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("PlantSite", "id", request.getPlantSiteId())));
        cr.setTargetImplementationDate(request.getTargetImplementationDate());
        cr.setAffectedAreas(request.getAffectedAreas());
        cr.setValidationRequired(request.getValidationRequired() != null ? request.getValidationRequired() : false);
        cr.setTrainingRequired(request.getTrainingRequired() != null ? request.getTrainingRequired() : false);
        cr.setRelatedDeviations(request.getRelatedDeviations());
        cr.setRelatedCapas(request.getRelatedCapas());
        cr.setCreatedBy(currentUser);
        cr.setUpdatedBy(currentUser);
        cr = changeRequestRepository.save(cr);

        auditTrailService.logAction("CHANGE_CONTROL", cr.getId(), cr.getChangeNumber(), "CREATED", null, null, null, null);
        workflowService.recordStep("CHANGE_CONTROL", cr.getId(), "Draft", WorkflowStepStatus.CURRENT, currentUser, null, 1);
        return toResponse(cr);
    }

    @Transactional
    public ChangeRequestResponse update(UUID id, UpdateChangeRequestRequest request) {
        ChangeRequest cr = changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        if (request.getTitle() != null) cr.setTitle(request.getTitle());
        if (request.getDescription() != null) cr.setDescription(request.getDescription());
        if (request.getJustification() != null) cr.setJustification(request.getJustification());
        if (request.getType() != null) cr.setType(ChangeType.valueOf(request.getType()));
        if (request.getCategory() != null) cr.setCategory(ChangeCategory.valueOf(request.getCategory()));
        if (request.getClassification() != null) cr.setClassification(ChangeClassification.valueOf(request.getClassification()));
        if (request.getPriority() != null) cr.setPriority(ChangePriority.valueOf(request.getPriority()));
        if (request.getTargetImplementationDate() != null) cr.setTargetImplementationDate(request.getTargetImplementationDate());
        if (request.getAffectedAreas() != null) cr.setAffectedAreas(request.getAffectedAreas());
        cr.setUpdatedBy(currentUserProvider.getCurrentUser());
        auditTrailService.logAction("CHANGE_CONTROL", cr.getId(), cr.getChangeNumber(), "UPDATED", null, null, null, null);
        return toResponse(changeRequestRepository.save(cr));
    }

    @Transactional
    public ChangeRequestResponse transitionStatus(UUID id, StatusTransitionRequest request) {
        ChangeRequest cr = changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        String oldStatus = cr.getStatus().name();
        ChangeStatus newStatus = ChangeStatus.valueOf(request.getStatus());
        if (newStatus == ChangeStatus.CLOSED) {
            validateClosureRules(cr);
            cr.setClosedDate(Instant.now());
        }
        cr.setStatus(newStatus);
        cr.setCurrentWorkflowStep(newStatus.name());
        cr.setUpdatedBy(currentUserProvider.getCurrentUser());
        changeRequestRepository.save(cr);
        auditTrailService.logAction("CHANGE_CONTROL", cr.getId(), cr.getChangeNumber(), "STATUS_CHANGED",
                "status", oldStatus, newStatus.name(), request.getComments());
        return toResponse(cr);
    }

    @Transactional
    public void submitImpactAssessment(UUID id, SubmitChangeImpactRequest request) {
        ChangeRequest cr = changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        ChangeImpactAssessment ia = new ChangeImpactAssessment();
        ia.setChangeRequest(cr);
        ia.setProductQuality(ImpactRating.valueOf(request.getProductQuality()));
        ia.setPatientSafety(ImpactRating.valueOf(request.getPatientSafety()));
        ia.setRegulatoryCompliance(ImpactRating.valueOf(request.getRegulatoryCompliance()));
        ia.setValidationStatus(ImpactRating.valueOf(request.getValidationStatus()));
        ia.setDocumentation(ImpactRating.valueOf(request.getDocumentation()));
        ia.setTraining(ImpactRating.valueOf(request.getTraining()));
        ia.setSupplierQualification(ImpactRating.valueOf(request.getSupplierQualification()));
        ia.setStability(ImpactRating.valueOf(request.getStability()));
        ia.setOverallRiskLevel(RiskLevel.valueOf(request.getOverallRiskLevel()));
        ia.setAssessmentSummary(request.getAssessmentSummary());
        ia.setAssessedBy(currentUserProvider.getCurrentUser());
        ia.setAssessedDate(Instant.now());
        impactRepository.save(ia);
        auditTrailService.logAction("CHANGE_CONTROL", cr.getId(), cr.getChangeNumber(), "IMPACT_ASSESSMENT_SUBMITTED", null, null, null, null);
    }

    @Transactional
    public void addAffectedDocument(UUID id, AddAffectedDocumentRequest request) {
        ChangeRequest cr = changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        ChangeAffectedDocument doc = new ChangeAffectedDocument();
        doc.setChangeRequest(cr);
        doc.setDocumentNumber(request.getDocumentNumber());
        doc.setDocumentTitle(request.getDocumentTitle());
        doc.setDocumentType(request.getDocumentType());
        doc.setCurrentVersion(request.getCurrentVersion());
        doc.setAction(DocumentAction.valueOf(request.getAction()));
        doc.setNewVersion(request.getNewVersion());
        affectedDocRepository.save(doc);
    }

    @Transactional
    public void addAffectedProduct(UUID id, AddAffectedProductRequest request) {
        ChangeRequest cr = changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        ChangeAffectedProduct prod = new ChangeAffectedProduct();
        prod.setChangeRequest(cr);
        prod.setProductName(request.getProductName());
        prod.setProductCode(request.getProductCode());
        prod.setDosageForm(request.getDosageForm());
        prod.setMarkets(request.getMarkets());
        prod.setImpactDescription(request.getImpactDescription());
        affectedProductRepository.save(prod);
    }

    @Transactional
    public void addImplementationTask(UUID id, AddImplementationTaskRequest request) {
        ChangeRequest cr = changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        int taskNum = cr.getImplementationTasks().size() + 1;
        ChangeImplementationTask task = new ChangeImplementationTask();
        task.setChangeRequest(cr);
        task.setTaskNumber(taskNum);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setAssignedTo(userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId())));
        if (request.getDepartmentId() != null)
            task.setDepartment(departmentRepository.findById(request.getDepartmentId()).orElse(null));
        task.setDueDate(request.getDueDate());
        taskRepository.save(task);
    }

    @Transactional
    public void updateImplementationTask(UUID id, UUID taskId, UpdateImplementationTaskRequest request) {
        ChangeImplementationTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("ImplementationTask", "id", taskId));
        if (request.getStatus() != null) task.setStatus(TaskStatus.valueOf(request.getStatus()));
        if (request.getComments() != null) task.setComments(request.getComments());
        if (request.getCompletedDate() != null) task.setCompletedDate(request.getCompletedDate());
        taskRepository.save(task);
    }

    @Transactional
    public void addTrainingRequirement(UUID id, AddTrainingRequirementRequest request) {
        ChangeRequest cr = changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        ChangeTrainingRequirement tr = new ChangeTrainingRequirement();
        tr.setChangeRequest(cr);
        tr.setTrainingTitle(request.getTrainingTitle());
        tr.setTargetAudience(request.getTargetAudience());
        if (request.getDepartmentId() != null)
            tr.setDepartment(departmentRepository.findById(request.getDepartmentId()).orElse(null));
        tr.setTrainingType(TrainingType.valueOf(request.getTrainingType()));
        tr.setDueDate(request.getDueDate());
        trainingRepository.save(tr);
    }

    @Transactional
    public void addApprover(UUID id, AddApproverRequest request) {
        ChangeRequest cr = changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        ChangeApproval approval = new ChangeApproval();
        approval.setChangeRequest(cr);
        approval.setApprover(userRepository.findById(request.getApproverId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getApproverId())));
        approval.setRole(request.getRole() != null ? request.getRole() : "Approver");
        approval.setDepartment(request.getDepartment());
        approval.setApprovalOrder(request.getApprovalOrder() != null ? request.getApprovalOrder() : 0);
        approvalRepository.save(approval);
    }

    @Transactional
    public void submitApprovalDecision(UUID id, UUID approvalId, SubmitApprovalDecisionRequest request) {
        ChangeApproval approval = approvalRepository.findById(approvalId)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeApproval", "id", approvalId));
        approval.setDecision(ApprovalDecision.valueOf(request.getDecision()));
        approval.setComments(request.getComments());
        approval.setDecisionDate(Instant.now());
        approvalRepository.save(approval);

        ChangeRequest cr = approval.getChangeRequest();
        auditTrailService.logAction("CHANGE_CONTROL", cr.getId(), cr.getChangeNumber(), "APPROVAL_DECISION",
                "decision", "PENDING", request.getDecision(), request.getComments());
    }

    @Transactional
    public void submitEffectivenessReview(UUID id, SubmitEffectivenessReviewRequest request) {
        ChangeRequest cr = changeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        ChangeEffectivenessReview review = new ChangeEffectivenessReview();
        review.setChangeRequest(cr);
        review.setReviewDate(request.getReviewDate());
        review.setReviewer(currentUserProvider.getCurrentUser());
        review.setOverallEffective(request.getOverallEffective());
        review.setSummary(request.getSummary());
        review.setFollowUpRequired(request.getFollowUpRequired() != null ? request.getFollowUpRequired() : false);
        review.setFollowUpActions(request.getFollowUpActions());
        review = reviewRepository.save(review);

        if (request.getCriteria() != null) {
            for (var c : request.getCriteria()) {
                ChangeEffectivenessCriteria criteria = new ChangeEffectivenessCriteria();
                criteria.setReview(review);
                criteria.setCriterion(c.getCriterion());
                criteria.setMet(c.getMet());
                criteria.setEvidence(c.getEvidence());
                criteriaRepository.save(criteria);
            }
        }
        auditTrailService.logAction("CHANGE_CONTROL", cr.getId(), cr.getChangeNumber(), "EFFECTIVENESS_REVIEW_SUBMITTED", null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<AuditTrailResponse> getAuditTrail(UUID id) {
        changeRequestRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("ChangeRequest", "id", id));
        return auditTrailService.getByRecord("CHANGE_CONTROL", id);
    }

    private void validateClosureRules(ChangeRequest cr) {
        long incompleteTasks = taskRepository.countByChangeRequestIdAndStatusNot(cr.getId(), TaskStatus.COMPLETED);
        if (incompleteTasks > 0)
            throw new BusinessRuleException(incompleteTasks + " implementation tasks incomplete", "CC_CLOSE_TASKS_INCOMPLETE");
        long pendingApprovals = approvalRepository.countByChangeRequestIdAndDecision(cr.getId(), ApprovalDecision.PENDING);
        if (pendingApprovals > 0)
            throw new BusinessRuleException(pendingApprovals + " approvals pending", "CC_CLOSE_APPROVALS_PENDING");
        if (cr.getTrainingRequired()) {
            long incompleteTraining = trainingRepository.countByChangeRequestIdAndCompletionStatusNot(cr.getId(), CompletionStatus.COMPLETED);
            if (incompleteTraining > 0)
                throw new BusinessRuleException(incompleteTraining + " training requirements incomplete", "CC_CLOSE_TRAINING_INCOMPLETE");
        }
    }

    private UserRef toUserRef(User u) {
        if (u == null) return null;
        return UserRef.builder().id(u.getId()).displayName(u.getDisplayName()).email(u.getEmail()).build();
    }

    private ChangeRequestResponse toResponse(ChangeRequest cr) {
        return ChangeRequestResponse.builder()
                .id(cr.getId()).changeNumber(cr.getChangeNumber()).title(cr.getTitle())
                .description(cr.getDescription()).justification(cr.getJustification())
                .type(cr.getType().name()).category(cr.getCategory().name())
                .classification(cr.getClassification().name()).status(cr.getStatus().name())
                .priority(cr.getPriority().name())
                .requestedBy(toUserRef(cr.getRequestedBy())).requestedDate(cr.getRequestedDate())
                .departmentId(cr.getDepartment().getId()).departmentName(cr.getDepartment().getName())
                .changeOwner(toUserRef(cr.getChangeOwner()))
                .qaReviewer(toUserRef(cr.getQaReviewer())).raReviewer(toUserRef(cr.getRaReviewer()))
                .plantSiteId(cr.getPlantSite().getId()).plantSiteName(cr.getPlantSite().getName())
                .affectedAreas(cr.getAffectedAreas())
                .targetImplementationDate(cr.getTargetImplementationDate())
                .actualImplementationDate(cr.getActualImplementationDate())
                .effectivenessCheckDate(cr.getEffectivenessCheckDate()).closedDate(cr.getClosedDate())
                .regulatoryFilingRequired(cr.getRegulatoryFilingRequired())
                .validationRequired(cr.getValidationRequired()).validationDetails(cr.getValidationDetails())
                .trainingRequired(cr.getTrainingRequired())
                .relatedDeviations(cr.getRelatedDeviations()).relatedCapas(cr.getRelatedCapas())
                .relatedChanges(cr.getRelatedChanges()).currentWorkflowStep(cr.getCurrentWorkflowStep())
                .createdAt(cr.getCreatedAt()).updatedAt(cr.getUpdatedAt()).version(cr.getVersion())
                .build();
    }
}
