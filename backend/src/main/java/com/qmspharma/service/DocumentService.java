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

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final DocumentReviewRepository reviewRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
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
        return toResponse(saved);
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

        if (newStatus == DocumentStatus.EFFECTIVE) {
            doc.setEffectiveDate(Instant.now());
            if (doc.getReviewPeriodMonths() != null) {
                doc.setNextReviewDate(Instant.now().plus(doc.getReviewPeriodMonths() * 30L, ChronoUnit.DAYS));
            }
        }

        Document saved = documentRepository.save(doc);
        auditTrailService.logAction("DOCUMENT", saved.getId(), saved.getDocumentNumber(), "STATUS_CHANGED",
                "status", oldStatus, newStatus.name(), null);
        return toResponse(saved);
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

    private UserRef toUserRef(User user) {
        if (user == null) return null;
        return UserRef.builder()
                .id(user.getId())
                .displayName(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .build();
    }
}