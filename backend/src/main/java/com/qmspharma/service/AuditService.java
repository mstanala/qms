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

import java.util.*;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final String RECORD_TYPE = "AUDIT";

    private final AuditRepository auditRepository;
    private final AuditPlanRepository auditPlanRepository;
    private final AuditFindingRepository auditFindingRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<AuditPlan> listPlans(String status, Integer planYear, Pageable pageable) {
        Specification<AuditPlan> spec = Specification.where(null);
        if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        if (planYear != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("planYear"), planYear));
        return auditPlanRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public AuditPlan getPlanById(UUID id) {
        return auditPlanRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Audit plan not found: " + id));
    }

    @Transactional
    public AuditPlan createPlan(Map<String, Object> request) {
        User currentUser = currentUserProvider.getCurrentUser();
        AuditPlan plan = new AuditPlan();
        plan.setPlanNumber(sequenceGenerator.generateNumber("AUDIT_PLAN"));
        plan.setTitle((String) request.get("title"));
        plan.setDescription((String) request.get("description"));
        plan.setPlanYear((Integer) request.get("planYear"));
        plan.setAuditType((String) request.get("auditType"));
        plan.setOwner(userRepository.getReferenceById(UUID.fromString((String) request.get("ownerId"))));
        plan.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString((String) request.get("plantSiteId"))));
        plan.setCreatedBy(currentUser);
        plan.setUpdatedBy(currentUser);
        return auditPlanRepository.save(plan);
    }

    @Transactional(readOnly = true)
    public Page<Audit> listAudits(String status, String auditType, UUID plantSiteId, String search, Pageable pageable) {
        Specification<Audit> spec = Specification.where(null);
        if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        if (auditType != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("auditType"), auditType));
        if (plantSiteId != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("plantSite").get("id"), plantSiteId));
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.or(
                    cb.like(cb.lower(r.get("title")), like),
                    cb.like(cb.lower(r.get("auditNumber")), like)
            ));
        }
        return auditRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Audit getAuditById(UUID id) {
        return auditRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Audit not found: " + id));
    }

    @Transactional
    public Audit createAudit(Map<String, Object> request) {
        User currentUser = currentUserProvider.getCurrentUser();
        Audit audit = new Audit();
        audit.setAuditNumber(sequenceGenerator.generateNumber("AUDIT"));
        audit.setTitle((String) request.get("title"));
        audit.setDescription((String) request.get("description"));
        audit.setAuditType((String) request.get("auditType"));
        audit.setAuditScope((String) request.get("auditScope"));
        audit.setLeadAuditor(userRepository.getReferenceById(UUID.fromString((String) request.get("leadAuditorId"))));
        audit.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString((String) request.get("plantSiteId"))));
        audit.setCreatedBy(currentUser);
        audit.setUpdatedBy(currentUser);

        Audit saved = auditRepository.save(audit);
        workflowService.startProcess("auditProcess", saved.getId().toString(), Map.of());
        return saved;
    }

    @Transactional
    public Audit updateAudit(UUID id, Map<String, Object> request) {
        Audit audit = getAuditById(id);
        if (request.containsKey("title")) audit.setTitle((String) request.get("title"));
        if (request.containsKey("auditScope")) audit.setAuditScope((String) request.get("auditScope"));
        if (request.containsKey("priority")) audit.setPriority((String) request.get("priority"));
        audit.setUpdatedBy(currentUserProvider.getCurrentUser());
        return auditRepository.save(audit);
    }

    @Transactional
    public Audit transitionStatus(UUID id, String newStatus) {
        Audit audit = getAuditById(id);
        String old = audit.getStatus();
        audit.setStatus(newStatus);
        audit.setUpdatedBy(currentUserProvider.getCurrentUser());
        auditTrailService.logAction(RECORD_TYPE, audit.getId(), audit.getAuditNumber(),
                "STATUS_CHANGE", "status", old, newStatus, null);
        return auditRepository.save(audit);
    }

    @Transactional(readOnly = true)
    public List<AuditFinding> listFindings(UUID auditId) {
        return auditFindingRepository.findByAuditId(auditId);
    }

    @Transactional
    public AuditFinding createFinding(UUID auditId, Map<String, Object> request) {
        Audit audit = getAuditById(auditId);
        AuditFinding f = new AuditFinding();
        f.setAudit(audit);
        f.setFindingNumber(sequenceGenerator.generateNumber("AUDIT_FINDING"));
        f.setTitle((String) request.get("title"));
        f.setDescription((String) request.get("description"));
        f.setClassification((String) request.get("classification"));
        f.setArea((String) request.get("area"));
        return auditFindingRepository.save(f);
    }

    @Transactional
    public AuditFinding updateFinding(UUID id, Map<String, Object> request) {
        AuditFinding f = auditFindingRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Finding not found: " + id));
        if (request.containsKey("status")) f.setStatus((String) request.get("status"));
        if (request.containsKey("auditeeResponse")) f.setAuditeeResponse((String) request.get("auditeeResponse"));
        return auditFindingRepository.save(f);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalAudits", auditRepository.count());
        m.put("overdue", auditRepository.countOverdue());
        m.put("byStatus", auditRepository.countByStatusGrouped());
        m.put("byType", auditRepository.countByAuditType());
        m.put("findingsByClassification", auditFindingRepository.countByClassification());
        m.put("findingsByStatus", auditFindingRepository.countByStatusGrouped());
        return m;
    }
}
