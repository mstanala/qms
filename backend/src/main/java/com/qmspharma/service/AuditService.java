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

import com.qmspharma.model.enums.*;

import java.time.Instant;
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
    private final CapaRepository capaRepository;
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
        audit.setCategory((String) request.get("category"));
        audit.setExecutiveSummary((String) request.get("executiveSummary"));
        audit.setFindingsSummary((String) request.get("findingsSummary"));
        audit.setFrequency((String) request.get("frequency"));
        audit.setProposedAction((String) request.get("proposedAction"));
        audit.setLifecycleState((String) request.getOrDefault("lifecycleState", "DRAFT"));
        audit.setPriority((String) request.getOrDefault("priority", "MEDIUM"));
        audit.setAreaAudited((String) request.get("areaAudited"));
        audit.setStandardsReference((String) request.get("standardsReference"));
        if (request.get("scheduledStartDate") != null) {
            audit.setScheduledStartDate(Instant.parse((String) request.get("scheduledStartDate")));
        } else {
            audit.setScheduledStartDate(Instant.now());
        }
        if (request.get("scheduledEndDate") != null) {
            audit.setScheduledEndDate(Instant.parse((String) request.get("scheduledEndDate")));
        } else {
            audit.setScheduledEndDate(Instant.now().plusSeconds(7L * 24 * 60 * 60));
        }
        audit.setLeadAuditor(userRepository.getReferenceById(UUID.fromString((String) request.get("leadAuditorId"))));
        audit.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString((String) request.get("plantSiteId"))));
        if (request.get("auditeeDepartmentId") != null) {
            audit.setAuditeeDepartment(departmentRepository.getReferenceById(UUID.fromString((String) request.get("auditeeDepartmentId"))));
        }
        if (request.get("auditeeContactId") != null) {
            audit.setAuditeeContact(userRepository.getReferenceById(UUID.fromString((String) request.get("auditeeContactId"))));
        }
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
        if (request.containsKey("category")) audit.setCategory((String) request.get("category"));
        if (request.containsKey("executiveSummary")) audit.setExecutiveSummary((String) request.get("executiveSummary"));
        if (request.containsKey("findingsSummary")) audit.setFindingsSummary((String) request.get("findingsSummary"));
        if (request.containsKey("frequency")) audit.setFrequency((String) request.get("frequency"));
        if (request.containsKey("proposedAction")) audit.setProposedAction((String) request.get("proposedAction"));
        if (request.containsKey("lifecycleState")) audit.setLifecycleState((String) request.get("lifecycleState"));
        audit.setUpdatedBy(currentUserProvider.getCurrentUser());
        return auditRepository.save(audit);
    }

    @Transactional
    public Audit transitionStatus(UUID id, String newStatus) {
        Audit audit = getAuditById(id);
        String old = audit.getStatus();
        audit.setStatus(newStatus);
        audit.setUpdatedBy(currentUserProvider.getCurrentUser());
        if ("IN_PROGRESS".equals(newStatus) && audit.getActualStartDate() == null) {
            audit.setActualStartDate(Instant.now());
        }
        if ("COMPLETED".equals(newStatus) && audit.getActualEndDate() == null) {
            audit.setActualEndDate(Instant.now());
        }
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
        f.setStandardReference((String) request.get("standardReference"));
        f.setObjectiveEvidence((String) request.get("objectiveEvidence"));
        if (request.get("responseDueDate") != null) {
            f.setResponseDueDate(Instant.parse((String) request.get("responseDueDate")));
        }
        if (request.get("capaRequired") != null) {
            f.setCapaRequired((Boolean) request.get("capaRequired"));
        }
        auditTrailService.logAction(RECORD_TYPE, audit.getId(), f.getFindingNumber(),
                "FINDING_CREATED", null, null, null, f.getClassification() + " - " + f.getTitle());
        return auditFindingRepository.save(f);
    }

    @Transactional
    public AuditFinding updateFinding(UUID id, Map<String, Object> request) {
        AuditFinding f = auditFindingRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Finding not found: " + id));
        if (request.containsKey("status")) {
            String oldStatus = f.getStatus();
            f.setStatus((String) request.get("status"));
            auditTrailService.logAction(RECORD_TYPE, f.getAudit().getId(), f.getFindingNumber(),
                    "FINDING_STATUS_CHANGE", "status", oldStatus, f.getStatus(), null);
        }
        if (request.containsKey("auditeeResponse")) f.setAuditeeResponse((String) request.get("auditeeResponse"));
        if (request.containsKey("title")) f.setTitle((String) request.get("title"));
        if (request.containsKey("description")) f.setDescription((String) request.get("description"));
        if (request.containsKey("classification")) f.setClassification((String) request.get("classification"));
        if (request.containsKey("area")) f.setArea((String) request.get("area"));
        if (request.containsKey("standardReference")) f.setStandardReference((String) request.get("standardReference"));
        if (request.containsKey("objectiveEvidence")) f.setObjectiveEvidence((String) request.get("objectiveEvidence"));
        if (request.containsKey("capaRequired")) f.setCapaRequired((Boolean) request.get("capaRequired"));
        return auditFindingRepository.save(f);
    }

    @Transactional
    public AuditPlan updatePlanStatus(UUID id, String newStatus) {
        AuditPlan plan = getPlanById(id);
        String old = plan.getStatus();
        plan.setStatus(newStatus);
        plan.setUpdatedBy(currentUserProvider.getCurrentUser());
        if ("APPROVED".equals(newStatus)) {
            plan.setApprovedBy(currentUserProvider.getCurrentUser());
            plan.setApprovedDate(Instant.now());
        }
        auditTrailService.logAction("AUDIT_PLAN", plan.getId(), plan.getPlanNumber(),
                "STATUS_CHANGE", "status", old, newStatus, null);
        return auditPlanRepository.save(plan);
    }

    @Transactional
    public AuditFinding verifyFinding(UUID id, Map<String, Object> request) {
        AuditFinding f = auditFindingRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Finding not found: " + id));
        User currentUser = currentUserProvider.getCurrentUser();
        f.setVerifiedBy(currentUser);
        f.setVerifiedDate(Instant.now());
        f.setVerificationComments((String) request.get("verificationComments"));
        f.setStatus("CLOSED");
        auditTrailService.logAction(RECORD_TYPE, f.getAudit().getId(), f.getFindingNumber(),
                "FINDING_VERIFIED", "status", "VERIFICATION", "CLOSED", (String) request.get("verificationComments"));
        return auditFindingRepository.save(f);
    }

    @Transactional
    public AuditFinding initiateCapaFromFinding(UUID findingId, Map<String, Object> request) {
        AuditFinding f = auditFindingRepository.findById(findingId)
                .orElseThrow(() -> new NoSuchElementException("Finding not found: " + findingId));
        User currentUser = currentUserProvider.getCurrentUser();

        Capa capa = new Capa();
        capa.setCapaNumber(sequenceGenerator.generateNumber("CAPA"));
        capa.setTitle("CAPA for Audit Finding: " + f.getTitle());
        capa.setDescription(f.getDescription());
        capa.setType(CapaType.CORRECTIVE);
        capa.setPriority(mapClassificationToPriority(f.getClassification()));
        capa.setSourceType(CapaSourceType.AUDIT_FINDING);
        capa.setSourceReference(f.getFindingNumber());
        capa.setPlantSite(f.getAudit().getPlantSite());
        capa.setInitiator(currentUser);
        capa.setOwner(currentUser);
        capa.setInitiatedDate(Instant.now());
        capa.setCreatedBy(currentUser);
        capa.setUpdatedBy(currentUser);

        // Set required fields with sensible defaults
        Instant now = Instant.now();
        Instant defaultDueDate = now.plusSeconds(30L * 24 * 60 * 60); // 30 days from now
        capa.setTargetCompletionDate(defaultDueDate);
        capa.setDueDate(defaultDueDate);

        // Use the audit's department if available, otherwise use the user's department
        if (f.getAudit().getAuditeeDepartment() != null) {
            capa.setDepartment(f.getAudit().getAuditeeDepartment());
        } else if (currentUser.getDepartment() != null) {
            capa.setDepartment(currentUser.getDepartment());
        }

        Capa savedCapa = capaRepository.save(capa);

        f.setCapa(savedCapa);
        f.setCapaRequired(true);
        f.setStatus("CAPA_ASSIGNED");

        auditTrailService.logAction(RECORD_TYPE, f.getAudit().getId(), f.getFindingNumber(),
                "CAPA_INITIATED", null, null, null, "CAPA " + savedCapa.getCapaNumber() + " created from finding");

        return auditFindingRepository.save(f);
    }

    private CapaPriority mapClassificationToPriority(String classification) {
        return switch (classification) {
            case "CRITICAL" -> CapaPriority.CRITICAL;
            case "MAJOR" -> CapaPriority.HIGH;
            case "MINOR" -> CapaPriority.MEDIUM;
            default -> CapaPriority.LOW;
        };
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalAudits", auditRepository.count());
        m.put("totalPlans", auditPlanRepository.count());
        m.put("totalFindings", auditFindingRepository.count());
        m.put("overdueAudits", auditRepository.countOverdue());
        m.put("byStatus", auditRepository.countByStatusGrouped());
        m.put("byType", auditRepository.countByAuditType());
        m.put("findingsByClassification", auditFindingRepository.countByClassification());
        m.put("findingsByStatus", auditFindingRepository.countByStatusGrouped());
        return m;
    }
}
