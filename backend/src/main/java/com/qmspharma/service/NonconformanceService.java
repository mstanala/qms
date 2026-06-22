package com.qmspharma.service;

import com.qmspharma.model.entity.*;
import com.qmspharma.model.dto.response.NonconformanceResponse;
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
public class NonconformanceService {

    private static final String RECORD_TYPE = "NONCONFORMANCE";

    private final NonconformanceRepository ncRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
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
        nc.setOwner(userRepository.getReferenceById(UUID.fromString((String) request.get("ownerId"))));
        nc.setDepartment(departmentRepository.getReferenceById(UUID.fromString((String) request.get("departmentId"))));
        nc.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString((String) request.get("plantSiteId"))));
        if (request.containsKey("productName")) nc.setProductName((String) request.get("productName"));
        if (request.containsKey("batchNumber")) nc.setBatchNumber((String) request.get("batchNumber"));
        if (request.containsKey("stageDetected")) nc.setStageDetected((String) request.get("stageDetected"));
        nc.setCreatedBy(currentUser);
        nc.setUpdatedBy(currentUser);

        Nonconformance saved = ncRepository.save(nc);
        workflowService.startProcess("nonconformanceProcess", saved.getId().toString(), Map.of());
        return toResponse(saved);
    }

    @Transactional
    public NonconformanceResponse update(UUID id, Map<String, Object> request) {
        Nonconformance nc = getEntityById(id);
        if (request.containsKey("title")) nc.setTitle((String) request.get("title"));
        if (request.containsKey("classification")) nc.setClassification((String) request.get("classification"));
        if (request.containsKey("quantityAffected")) nc.setQuantityAffected((String) request.get("quantityAffected"));
        nc.setUpdatedBy(currentUserProvider.getCurrentUser());
        return toResponse(ncRepository.save(nc));
    }

    @Transactional
    public NonconformanceResponse transitionStatus(UUID id, String newStatus) {
        Nonconformance nc = getEntityById(id);
        String old = nc.getStatus();
        nc.setStatus(newStatus);
        if ("CLOSED".equals(newStatus)) nc.setClosedDate(Instant.now());
        nc.setUpdatedBy(currentUserProvider.getCurrentUser());
        auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                "STATUS_CHANGE", "status", old, newStatus, null);
        return toResponse(ncRepository.save(nc));
    }

    @Transactional
    public NonconformanceResponse submitDisposition(UUID id, Map<String, Object> request) {
        Nonconformance nc = getEntityById(id);
        nc.setDispositionDecision((String) request.get("dispositionDecision"));
        nc.setDispositionJustification((String) request.get("justification"));
        nc.setDispositionDate(Instant.now());
        nc.setDispositionApprovedBy(currentUserProvider.getCurrentUser());
        nc.setStatus("DISPOSITION_APPROVED");
        nc.setUpdatedBy(currentUserProvider.getCurrentUser());
        return toResponse(ncRepository.save(nc));
    }

    @Transactional
    public NonconformanceResponse toggleHold(UUID id, Map<String, Object> request) {
        Nonconformance nc = getEntityById(id);
        String action = (String) request.get("action");
        if ("HOLD".equals(action)) {
            nc.setHoldStatus("HOLD");
            nc.setHoldLocation((String) request.get("holdLocation"));
            nc.setHoldInitiatedDate(Instant.now());
        } else {
            nc.setHoldStatus("RELEASED");
            nc.setHoldReleasedDate(Instant.now());
            nc.setHoldReleasedBy(currentUserProvider.getCurrentUser());
        }
        nc.setUpdatedBy(currentUserProvider.getCurrentUser());
        return toResponse(ncRepository.save(nc));
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
