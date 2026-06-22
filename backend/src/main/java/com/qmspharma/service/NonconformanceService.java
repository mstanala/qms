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
    public Page<Nonconformance> list(String status, String ncType, String holdStatus,
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
        return ncRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Nonconformance getById(UUID id) {
        return ncRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Nonconformance not found: " + id));
    }

    @Transactional
    public Nonconformance create(Map<String, Object> request) {
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
        return saved;
    }

    @Transactional
    public Nonconformance update(UUID id, Map<String, Object> request) {
        Nonconformance nc = getById(id);
        if (request.containsKey("title")) nc.setTitle((String) request.get("title"));
        if (request.containsKey("classification")) nc.setClassification((String) request.get("classification"));
        if (request.containsKey("quantityAffected")) nc.setQuantityAffected((String) request.get("quantityAffected"));
        nc.setUpdatedBy(currentUserProvider.getCurrentUser());
        return ncRepository.save(nc);
    }

    @Transactional
    public Nonconformance transitionStatus(UUID id, String newStatus) {
        Nonconformance nc = getById(id);
        String old = nc.getStatus();
        nc.setStatus(newStatus);
        if ("CLOSED".equals(newStatus)) nc.setClosedDate(Instant.now());
        nc.setUpdatedBy(currentUserProvider.getCurrentUser());
        auditTrailService.logAction(RECORD_TYPE, nc.getId(), nc.getNcNumber(),
                "STATUS_CHANGE", "status", old, newStatus, null);
        return ncRepository.save(nc);
    }

    @Transactional
    public Nonconformance submitDisposition(UUID id, Map<String, Object> request) {
        Nonconformance nc = getById(id);
        nc.setDispositionDecision((String) request.get("dispositionDecision"));
        nc.setDispositionJustification((String) request.get("justification"));
        nc.setDispositionDate(Instant.now());
        nc.setDispositionApprovedBy(currentUserProvider.getCurrentUser());
        nc.setStatus("DISPOSITION_APPROVED");
        nc.setUpdatedBy(currentUserProvider.getCurrentUser());
        return ncRepository.save(nc);
    }

    @Transactional
    public Nonconformance toggleHold(UUID id, Map<String, Object> request) {
        Nonconformance nc = getById(id);
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
        return ncRepository.save(nc);
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
}
