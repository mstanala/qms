package com.qmspharma.service;

import com.qmspharma.model.entity.*;
import com.qmspharma.model.dto.response.ComplaintResponse;
import com.qmspharma.model.dto.response.ReferenceResponse;
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
public class ComplaintService {

    private static final String RECORD_TYPE = "COMPLAINT";

    private final ComplaintRepository complaintRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
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
        c.setCreatedBy(currentUser);
        c.setUpdatedBy(currentUser);

        Complaint saved = complaintRepository.save(c);
        workflowService.startProcess("complaintProcess", saved.getId().toString(), Map.of());
        return toResponse(saved);
    }

    @Transactional
    public ComplaintResponse update(UUID id, Map<String, Object> request) {
        Complaint c = getEntityById(id);
        if (request.containsKey("title")) c.setTitle((String) request.get("title"));
        if (request.containsKey("rootCause")) c.setRootCause((String) request.get("rootCause"));
        if (request.containsKey("conclusion")) c.setConclusion((String) request.get("conclusion"));
        if (request.containsKey("classification")) c.setClassification((String) request.get("classification"));
        c.setUpdatedBy(currentUserProvider.getCurrentUser());
        return toResponse(complaintRepository.save(c));
    }

    @Transactional
    public ComplaintResponse transitionStatus(UUID id, String newStatus) {
        Complaint c = getEntityById(id);
        String old = c.getStatus();
        c.setStatus(newStatus);
        if ("CLOSED".equals(newStatus)) c.setClosedDate(Instant.now());
        c.setUpdatedBy(currentUserProvider.getCurrentUser());
        auditTrailService.logAction(RECORD_TYPE, c.getId(), c.getComplaintNumber(),
                "STATUS_CHANGE", "status", old, newStatus, null);
        return toResponse(complaintRepository.save(c));
    }

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
