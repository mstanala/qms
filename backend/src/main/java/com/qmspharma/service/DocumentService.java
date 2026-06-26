package com.qmspharma.service;

import com.qmspharma.exception.ResourceNotFoundException;
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
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {
    private static final String PROCESS_KEY = "documentProcess";
    private static final String RECORD_TYPE = "DOCUMENT";
    private static final List<String> DOCUMENT_REVIEW_ROLES = List.of("DOC_CONTROLLER", "QA_REVIEWER");
    private static final List<String> DOCUMENT_APPROVAL_ROLES = List.of("QA_APPROVER");

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final DocumentReviewRepository reviewRepository;
    private final DocumentApprovalRepository approvalRepository;
    private final DocumentDistributionRepository distributionRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<DocumentResponse> list(List<String> statuses, List<String> documentTypes,
                                        String category, String search, Pageable pageable) {
        Specification<Document> spec = Specification.where(null);
        if (statuses != null && !statuses.isEmpty()) {
            var enums = statuses.stream().map(DocumentStatus::valueOf).toList();
            spec = spec.and((root, q, cb) -> root.get("status").in(enums));
        }
        if (documentTypes != null && !documentTypes.isEmpty()) {
            var enums = documentTypes.stream().map(DocumentType::valueOf).toList();
            spec = spec.and((root, q, cb) -> root.get("documentType").in(enums));
        }
        if (category != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("category"), category));
        }
        if (search != null) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("documentNumber")), pattern),
                    cb.like(cb.lower(root.get("keywords")), pattern)));
        }
        return documentRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public DocumentResponse getById(UUID id) {
        return toDetailResponse(documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id)));
    }

    @Transactional
    public DocumentResponse create(CreateDocumentRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        Document doc = new Document();
        doc.setDocumentNumber(sequenceGenerator.generateNumber("DOCUMENT"));
        doc.setTitle(request.getTitle());
        doc.setDescription(request.getDescription());
        doc.setDocumentType(DocumentType.valueOf(request.getDocumentType()));
        doc.setCategory(request.getCategory());
        doc.setSubCategory(request.getSubCategory());
        if (request.getDepartmentId() != null) {
            doc.setDepartment(departmentRepository.findById(request.getDepartmentId()).orElse(null));
        }
        if (request.getPlantSiteId() != null) {
            doc.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId()).orElse(null));
        }
        doc.setOwner(currentUser);
        doc.setReviewPeriodMonths(request.getReviewPeriodMonths() != null ? request.getReviewPeriodMonths() : 24);
        if (request.getConfidentialityLevel() != null) {
            doc.setConfidentialityLevel(ConfidentialityLevel.valueOf(request.getConfidentialityLevel()));
        }
        doc.setRegulatoryReference(request.getRegulatoryReference());
        doc.setKeywords(request.getKeywords());
        doc.setCurrentWorkflowStep("Draft");
        doc.setCreatedBy(currentUser);
        doc.setUpdatedBy(currentUser);

        Document saved = documentRepository.save(doc);
        auditTrailService.logAction("DOCUMENT", saved.getId(), saved.getDocumentNumber(), "CREATED", null, null, null, null);
        return toDetailResponse(saved);
    }

    @Transactional
    public DocumentResponse update(UUID id, UpdateDocumentRequest request) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();

        if (request.getTitle() != null) doc.setTitle(request.getTitle());
        if (request.getDescription() != null) doc.setDescription(request.getDescription());
        if (request.getDocumentType() != null) doc.setDocumentType(DocumentType.valueOf(request.getDocumentType()));
        if (request.getCategory() != null) doc.setCategory(request.getCategory());
        if (request.getSubCategory() != null) doc.setSubCategory(request.getSubCategory());
        if (request.getDepartmentId() != null) doc.setDepartment(departmentRepository.findById(request.getDepartmentId()).orElse(null));
        if (request.getPlantSiteId() != null) doc.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId()).orElse(null));
        if (request.getReviewPeriodMonths() != null) doc.setReviewPeriodMonths(request.getReviewPeriodMonths());
        if (request.getConfidentialityLevel() != null) doc.setConfidentialityLevel(ConfidentialityLevel.valueOf(request.getConfidentialityLevel()));
        if (request.getRegulatoryReference() != null) doc.setRegulatoryReference(request.getRegulatoryReference());
        if (request.getKeywords() != null) doc.setKeywords(request.getKeywords());
        doc.setUpdatedBy(currentUser);

        Document saved = documentRepository.save(doc);
        auditTrailService.logAction("DOCUMENT", saved.getId(), saved.getDocumentNumber(), "UPDATED", null, null, null, null);
        return toResponse(saved);
    }

    @Transactional
    public DocumentResponse transitionStatus(UUID id, DocumentStatusRequest request) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        User currentUser = currentUserProvider.getCurrentUser();

        String oldStatus = doc.getStatus().name();
        DocumentStatus newStatus = DocumentStatus.valueOf(request.getStatus());
        doc.setStatus(newStatus);
        doc.setCurrentWorkflowStep(newStatus.name().replace("_", " "));
        doc.setUpdatedBy(currentUser);

        handleWorkflowTransition(doc, newStatus, currentUser, request.getComments());

        if (newStatus == DocumentStatus.EFFECTIVE) {
            doc.setEffectiveDate(Instant.now());
            if (doc.getReviewPeriodMonths() != null) {
                doc.setNextReviewDate(Instant.now().plus(doc.getReviewPeriodMonths() * 30L, ChronoUnit.DAYS));
            }
        }

        Document saved = documentRepository.save(doc);
        auditTrailService.logAction(RECORD_TYPE, saved.getId(), saved.getDocumentNumber(), "STATUS_CHANGED",
                "status", oldStatus, newStatus.name(), null);
        return toDetailResponse(saved);
    }

    @Transactional(readOnly = true)
    public DocumentDashboardResponse getDashboard() {
        Instant now = Instant.now();
        Instant thirtyDays = now.plus(30, ChronoUnit.DAYS);

        List<DocumentDashboardResponse.TypeCount> byType = documentRepository.countByType().stream()
                .map(r -> DocumentDashboardResponse.TypeCount.builder()
                        .type(r[0].toString()).count((Long) r[1]).build())
                .collect(Collectors.toList());

        List<DocumentDashboardResponse.StatusCount> byStatus = documentRepository.countByStatus().stream()
                .map(r -> DocumentDashboardResponse.StatusCount.builder()
                        .status(r[0].toString()).count((Long) r[1]).build())
                .collect(Collectors.toList());

        return DocumentDashboardResponse.builder()
                .totalDocuments(documentRepository.count())
                .effectiveDocuments(documentRepository.countByStatus(DocumentStatus.EFFECTIVE))
                .draftDocuments(documentRepository.countByStatus(DocumentStatus.DRAFT))
                .pendingReview(documentRepository.countByStatus(DocumentStatus.PENDING_REVIEW)
                        + documentRepository.countByStatus(DocumentStatus.UNDER_REVIEW))
                .pendingApproval(documentRepository.countByStatus(DocumentStatus.PENDING_APPROVAL))
                .overdueReviews(documentRepository.countOverdueReviews(now))
                .expiringNext30Days(documentRepository.countExpiringWithin(now, thirtyDays))
                .byType(byType)
                .byStatus(byStatus)
                .build();
    }

    private DocumentResponse toResponse(Document doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .documentNumber(doc.getDocumentNumber())
                .title(doc.getTitle())
                .description(doc.getDescription())
                .documentType(doc.getDocumentType().name())
                .category(doc.getCategory())
                .subCategory(doc.getSubCategory())
                .departmentId(doc.getDepartment() != null ? doc.getDepartment().getId() : null)
                .departmentName(doc.getDepartment() != null ? doc.getDepartment().getName() : null)
                .plantSiteId(doc.getPlantSite() != null ? doc.getPlantSite().getId() : null)
                .plantSiteName(doc.getPlantSite() != null ? doc.getPlantSite().getName() : null)
                .owner(toUserRef(doc.getOwner()))
                .status(doc.getStatus().name())
                .currentVersion(doc.getCurrentVersion())
                .effectiveDate(doc.getEffectiveDate())
                .expiryDate(doc.getExpiryDate())
                .nextReviewDate(doc.getNextReviewDate())
                .reviewPeriodMonths(doc.getReviewPeriodMonths())
                .confidentialityLevel(doc.getConfidentialityLevel().name())
                .regulatoryReference(doc.getRegulatoryReference())
                .keywords(doc.getKeywords())
                .isTemplate(doc.getIsTemplate())
                .currentWorkflowStep(doc.getCurrentWorkflowStep())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .version(doc.getVersion())
                .build();
    }

    private DocumentResponse toDetailResponse(Document doc) {
        DocumentResponse response = toResponse(doc);
        response.setVersions(doc.getVersions().stream().map(this::toVersionResponse).collect(Collectors.toList()));
        response.setReviews(doc.getReviews().stream().map(this::toReviewResponse).collect(Collectors.toList()));
        response.setApprovals(doc.getVersions().stream()
                .flatMap(version -> approvalRepository.findByDocumentVersionId(version.getId()).stream())
                .sorted(Comparator.comparing(DocumentApproval::getApprovalOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(this::toApprovalResponse)
                .collect(Collectors.toList()));
        response.setDistributions(doc.getVersions().stream()
                .flatMap(version -> distributionRepository.findByDocumentVersionId(version.getId()).stream())
                .sorted(Comparator.comparing(DocumentDistribution::getDistributionDate, Comparator.nullsLast(Instant::compareTo)).reversed())
                .map(this::toDistributionResponse)
                .collect(Collectors.toList()));
        response.setAuditTrail(auditTrailService.getByRecord(RECORD_TYPE, doc.getId()));
        addWorkflowRouting(response, doc);
        return response;
    }

    private DocumentVersionResponse toVersionResponse(DocumentVersion v) {
        return DocumentVersionResponse.builder()
                .id(v.getId())
                .versionNumber(v.getVersionNumber())
                .majorVersion(v.getMajorVersion())
                .minorVersion(v.getMinorVersion())
                .changeDescription(v.getChangeDescription())
                .changeType(v.getChangeType().name())
                .status(v.getStatus().name())
                .fileName(v.getFileName())
                .fileSize(v.getFileSize())
                .contentType(v.getContentType())
                .author(v.getAuthor() != null ? toUserRef(v.getAuthor()) : null)
                .reviewer(v.getReviewer() != null ? toUserRef(v.getReviewer()) : null)
                .approver(v.getApprover() != null ? toUserRef(v.getApprover()) : null)
                .approvedDate(v.getApprovedDate())
                .effectiveDate(v.getEffectiveDate())
                .supersededDate(v.getSupersededDate())
                .createdAt(v.getCreatedAt())
                .build();
    }

    private DocumentReviewResponse toReviewResponse(DocumentReview r) {
        return DocumentReviewResponse.builder()
                .id(r.getId())
                .reviewType(r.getReviewType().name())
                .reviewDueDate(r.getReviewDueDate())
                .reviewCompletedDate(r.getReviewCompletedDate())
                .reviewer(r.getReviewer() != null ? toUserRef(r.getReviewer()) : null)
                .reviewDecision(r.getReviewDecision() != null ? r.getReviewDecision().name() : null)
                .comments(r.getComments())
                .nextReviewDate(r.getNextReviewDate())
                .status(r.getStatus().name())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private DocumentApprovalResponse toApprovalResponse(DocumentApproval a) {
        return DocumentApprovalResponse.builder()
                .id(a.getId())
                .approver(a.getApprover() != null ? toUserRef(a.getApprover()) : null)
                .role(a.getRole())
                .approvalOrder(a.getApprovalOrder())
                .decision(a.getDecision().name())
                .comments(a.getComments())
                .decisionDate(a.getDecisionDate())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private DocumentDistributionResponse toDistributionResponse(DocumentDistribution d) {
        return DocumentDistributionResponse.builder()
                .id(d.getId())
                .recipient(d.getRecipient() != null ? toUserRef(d.getRecipient()) : null)
                .departmentName(d.getDepartment() != null ? d.getDepartment().getName() : null)
                .distributionDate(d.getDistributionDate())
                .acknowledged(d.getAcknowledged())
                .acknowledgedDate(d.getAcknowledgedDate())
                .trainingRequired(d.getTrainingRequired())
                .trainingCompleted(d.getTrainingCompleted())
                .build();
    }

    private void addWorkflowRouting(DocumentResponse response, Document doc) {
        UUID plantSiteId = doc.getPlantSite() != null ? doc.getPlantSite().getId() : null;
        List<UserRef> reviewCandidates = findRoleUsers(DOCUMENT_REVIEW_ROLES, plantSiteId);
        List<UserRef> approvalCandidates = findRoleUsers(DOCUMENT_APPROVAL_ROLES, plantSiteId);

        response.setReviewCandidateRoles(DOCUMENT_REVIEW_ROLES);
        response.setReviewCandidateUsers(reviewCandidates);
        response.setApprovalCandidateRoles(DOCUMENT_APPROVAL_ROLES);
        response.setApprovalCandidateUsers(approvalCandidates);

        if (doc.getStatus() == DocumentStatus.PENDING_REVIEW || doc.getStatus() == DocumentStatus.UNDER_REVIEW) {
            response.setCurrentCandidateRoles(DOCUMENT_REVIEW_ROLES);
            response.setCurrentCandidateUsers(reviewCandidates);
        } else if (doc.getStatus() == DocumentStatus.PENDING_APPROVAL) {
            response.setCurrentCandidateRoles(DOCUMENT_APPROVAL_ROLES);
            response.setCurrentCandidateUsers(approvalCandidates);
        } else {
            response.setCurrentCandidateRoles(List.of());
            response.setCurrentCandidateUsers(List.of());
        }
    }

    private List<UserRef> findRoleUsers(List<String> roleCodes, UUID plantSiteId) {
        return userRepository.findActiveUsersByRoleCodes(roleCodes, plantSiteId).stream()
                .map(this::toUserRef)
                .collect(Collectors.toList());
    }

    private void handleWorkflowTransition(Document doc, DocumentStatus newStatus, User currentUser, String comments) {
        switch (newStatus) {
            case PENDING_REVIEW, UNDER_REVIEW -> {
                getOrCreateCurrentVersion(doc, currentUser).setStatus(DocumentVersionStatus.UNDER_REVIEW);
                ensureDocumentProcessStarted(doc, currentUser);
                workflowService.recordStep(RECORD_TYPE, doc.getId(), "Document Draft Review",
                        WorkflowStepStatus.CURRENT, null, comments, 1);
                notifyRoleUsers(doc, DOCUMENT_REVIEW_ROLES, "Document Review Required",
                        "Document " + doc.getDocumentNumber() + " is ready for draft review.",
                        NotificationType.TASK_ASSIGNED);
            }
            case PENDING_APPROVAL -> {
                DocumentVersion version = getOrCreateCurrentVersion(doc, currentUser);
                version.setStatus(DocumentVersionStatus.UNDER_REVIEW);
                version.setReviewer(currentUser);
                versionRepository.save(version);
                recordDocumentReview(doc, currentUser, comments);
                if (doc.getFlowableProcessId() != null) {
                    Map<String, Object> vars = new HashMap<>();
                    vars.put("reviewDecision", "APPROVED");
                    workflowService.completeTask(doc.getFlowableProcessId(), "draftReview", vars);
                }
                workflowService.recordStep(RECORD_TYPE, doc.getId(), "Document Draft Review",
                        WorkflowStepStatus.COMPLETED, currentUser, comments, 1);
                workflowService.recordStep(RECORD_TYPE, doc.getId(), "QA Approval",
                        WorkflowStepStatus.CURRENT, null, null, 2);
                notifyRoleUsers(doc, DOCUMENT_APPROVAL_ROLES, "Document Approval Required",
                        "Document " + doc.getDocumentNumber() + " is ready for QA approval.",
                        NotificationType.APPROVAL_REQUIRED);
            }
            case APPROVED -> {
                DocumentVersion version = getOrCreateCurrentVersion(doc, currentUser);
                version.setStatus(DocumentVersionStatus.APPROVED);
                version.setApprover(currentUser);
                version.setApprovedDate(Instant.now());
                versionRepository.save(version);
                recordDocumentApproval(version, currentUser, comments);
                createInitialDistributions(doc, version);
                if (doc.getFlowableProcessId() != null) {
                    Map<String, Object> vars = new HashMap<>();
                    vars.put("approvalDecision", "APPROVED");
                    workflowService.completeTask(doc.getFlowableProcessId(), "qaApproval", vars);
                }
                workflowService.recordStep(RECORD_TYPE, doc.getId(), "QA Approval",
                        WorkflowStepStatus.COMPLETED, currentUser, comments, 2);
                workflowService.recordStep(RECORD_TYPE, doc.getId(), "Training Assignment",
                        WorkflowStepStatus.CURRENT, null, null, 3);
            }
            case EFFECTIVE -> workflowService.recordStep(RECORD_TYPE, doc.getId(), "Document Effective",
                    WorkflowStepStatus.COMPLETED, currentUser, comments, 4);
            default -> {
            }
        }
    }

    private void ensureDocumentProcessStarted(Document doc, User currentUser) {
        if (doc.getFlowableProcessId() != null && workflowService.isProcessActive(doc.getFlowableProcessId())) {
            return;
        }

        Map<String, Object> vars = new HashMap<>();
        vars.put("recordId", doc.getId().toString());
        vars.put("documentNumber", doc.getDocumentNumber());
        vars.put("documentType", doc.getDocumentType().name());
        vars.put("authorId", currentUser.getId().toString());
        vars.put("version", doc.getCurrentVersion());
        if (doc.getPlantSite() != null) vars.put("plantSiteId", doc.getPlantSite().getId().toString());
        if (doc.getDepartment() != null) vars.put("departmentId", doc.getDepartment().getId().toString());

        String processId = workflowService.startProcess(PROCESS_KEY, doc.getId().toString(), vars);
        doc.setFlowableProcessId(processId);
    }

    private void notifyRoleUsers(Document doc, List<String> roleCodes, String title, String message, NotificationType type) {
        UUID plantSiteId = doc.getPlantSite() != null ? doc.getPlantSite().getId() : null;
        userRepository.findActiveUsersByRoleCodes(roleCodes, plantSiteId).stream()
                .filter(user -> doc.getOwner() == null || !user.getId().equals(doc.getOwner().getId()))
                .forEach(user -> notificationService.send(user.getId(), title, message, type,
                        RECORD_TYPE, doc.getId(), doc.getDocumentNumber()));
    }

    private DocumentVersion getOrCreateCurrentVersion(Document doc, User currentUser) {
        return doc.getVersions().stream()
                .filter(version -> Objects.equals(version.getVersionNumber(), doc.getCurrentVersion()))
                .findFirst()
                .orElseGet(() -> {
                    DocumentVersion version = new DocumentVersion();
                    version.setDocument(doc);
                    version.setVersionNumber(doc.getCurrentVersion() != null ? doc.getCurrentVersion() : "1.0");
                    version.setMajorVersion(parseMajorVersion(version.getVersionNumber()));
                    version.setMinorVersion(parseMinorVersion(version.getVersionNumber()));
                    version.setChangeDescription("Initial document version");
                    version.setChangeType(DocumentChangeType.NEW);
                    version.setStatus(DocumentVersionStatus.DRAFT);
                    version.setAuthor(doc.getOwner() != null ? doc.getOwner() : currentUser);
                    DocumentVersion saved = versionRepository.save(version);
                    doc.getVersions().add(saved);
                    return saved;
                });
    }

    private void recordDocumentReview(Document doc, User reviewer, String comments) {
        DocumentReview review = new DocumentReview();
        review.setDocument(doc);
        review.setReviewType(ReviewType.INITIAL);
        review.setReviewDueDate(Instant.now());
        review.setReviewCompletedDate(Instant.now());
        review.setReviewer(reviewer);
        review.setReviewDecision(ReviewDecision.NO_CHANGE_REQUIRED);
        review.setComments(comments);
        review.setStatus(ReviewStatus.COMPLETED);
        reviewRepository.save(review);
    }

    private void recordDocumentApproval(DocumentVersion version, User approver, String comments) {
        DocumentApproval approval = new DocumentApproval();
        approval.setDocumentVersion(version);
        approval.setApprover(approver);
        approval.setRole("QA Approver");
        approval.setApprovalOrder(1);
        approval.setDecision(ApprovalDecisionType.APPROVED);
        approval.setComments(comments);
        approval.setDecisionDate(Instant.now());
        approvalRepository.save(approval);
    }

    private void createInitialDistributions(Document doc, DocumentVersion version) {
        Set<User> recipients = new LinkedHashSet<>();
        if (doc.getOwner() != null) {
            recipients.add(doc.getOwner());
        }
        if (doc.getDepartment() != null) {
            recipients.addAll(userRepository.findByDepartmentIdAndIsActiveTrue(doc.getDepartment().getId()));
        }

        for (User recipient : recipients) {
            if (distributionRepository.existsByDocumentVersionIdAndRecipientId(version.getId(), recipient.getId())) {
                continue;
            }
            DocumentDistribution distribution = new DocumentDistribution();
            distribution.setDocumentVersion(version);
            distribution.setRecipient(recipient);
            distribution.setDepartment(recipient.getDepartment() != null ? recipient.getDepartment() : doc.getDepartment());
            distribution.setDistributionDate(Instant.now());
            distribution.setAcknowledged(false);
            distribution.setTrainingRequired(false);
            distribution.setTrainingCompleted(false);
            distributionRepository.save(distribution);
        }
    }

    private int parseMajorVersion(String version) {
        return parseVersionPart(version, 0, 1);
    }

    private int parseMinorVersion(String version) {
        return parseVersionPart(version, 1, 0);
    }

    private int parseVersionPart(String version, int index, int defaultValue) {
        if (version == null) return defaultValue;
        String[] parts = version.split("\\.");
        if (parts.length <= index) return defaultValue;
        try {
            return Integer.parseInt(parts[index]);
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    private UserRef toUserRef(User user) {
        if (user == null) return null;
        return UserRef.builder()
                .id(user.getId())
                .displayName(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .build();
    }
}
