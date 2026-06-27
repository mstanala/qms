package com.qmspharma.service;

import com.qmspharma.model.entity.*;
import com.qmspharma.model.dto.response.CalibrationRecordResponse;
import com.qmspharma.model.dto.response.EquipmentResponse;
import com.qmspharma.model.dto.response.MaintenanceRecordResponse;
import com.qmspharma.model.dto.response.UserRef;
import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.model.enums.WorkflowStepStatus;
import com.qmspharma.repository.*;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EquipmentService {

    private static final String RECORD_TYPE = "EQUIPMENT";
    private static final String PROCESS_KEY = "equipmentCalibrationProcess";
    private static final Set<String> VALID_EQUIPMENT_STATUSES = Set.of(
            "ACTIVE", "INACTIVE", "OUT_OF_SERVICE", "DECOMMISSIONED",
            "UNDER_MAINTENANCE", "UNDER_CALIBRATION", "QUALIFIED");
    private static final Set<String> VALID_QUALIFICATION_STATUSES = Set.of(
            "NOT_QUALIFIED", "IQ_COMPLETED", "OQ_COMPLETED", "PQ_COMPLETED",
            "FULLY_QUALIFIED", "REQUALIFICATION_DUE", "QUALIFICATION_EXPIRED",
            "REQUALIFICATION_IN_PROGRESS");
    private static final Set<String> VALID_CALIBRATION_STATUSES = Set.of(
            "CALIBRATED", "DUE", "OVERDUE", "NOT_APPLICABLE", "OUT_OF_CALIBRATION");

    private final EquipmentRepository equipmentRepository;
    private final CalibrationRecordRepository calibrationRepository;
    private final MaintenanceRecordRepository maintenanceRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final WorkflowService workflowService;
    private final CurrentUserProvider currentUserProvider;

    // =========================================================================
    // Equipment CRUD
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<EquipmentResponse> list(String status, String equipmentType, UUID plantSiteId, String search, Pageable pageable) {
        Specification<Equipment> spec = Specification.where(null);
        if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        if (equipmentType != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("equipmentType"), equipmentType));
        if (plantSiteId != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("plantSite").get("id"), plantSiteId));
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.or(
                    cb.like(cb.lower(r.get("name")), like),
                    cb.like(cb.lower(r.get("equipmentNumber")), like)
            ));
        }
        return equipmentRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public EquipmentResponse getById(UUID id) {
        return toResponse(getEntityById(id));
    }

    @Transactional
    public EquipmentResponse create(Map<String, Object> request) {
        User currentUser = currentUserProvider.getCurrentUser();
        Equipment e = new Equipment();
        e.setEquipmentNumber(sequenceGenerator.generateNumber("EQUIPMENT"));
        e.setName((String) request.get("name"));
        e.setDescription((String) request.get("description"));
        e.setEquipmentType((String) request.get("equipmentType"));
        e.setCategory((String) request.get("category"));
        e.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString((String) request.get("plantSiteId"))));
        String departmentId = stringValue(request.get("departmentId"));
        if (departmentId != null) {
            e.setDepartment(departmentRepository.getReferenceById(UUID.fromString(departmentId)));
        }
        if (request.containsKey("manufacturer")) e.setManufacturer((String) request.get("manufacturer"));
        if (request.containsKey("modelNumber")) e.setModelNumber((String) request.get("modelNumber"));
        if (request.containsKey("serialNumber")) e.setSerialNumber((String) request.get("serialNumber"));
        if (request.containsKey("assetTag")) e.setAssetTag((String) request.get("assetTag"));
        if (request.containsKey("area")) e.setArea((String) request.get("area"));
        if (request.containsKey("roomNumber")) e.setRoomNumber((String) request.get("roomNumber"));
        if (request.containsKey("calibrationRequired")) e.setCalibrationRequired((Boolean) request.get("calibrationRequired"));
        if (request.containsKey("calibrationFrequencyDays")) e.setCalibrationFrequencyDays(toInteger(request.get("calibrationFrequencyDays")));
        if (request.containsKey("maintenanceFrequencyDays")) e.setMaintenanceFrequencyDays(toInteger(request.get("maintenanceFrequencyDays")));
        if (request.containsKey("gxpRelevant")) e.setGxpRelevant((Boolean) request.get("gxpRelevant"));
        if (request.containsKey("computerizedSystem")) e.setComputerizedSystem((Boolean) request.get("computerizedSystem"));
        if (request.containsKey("dataIntegrityClass")) e.setDataIntegrityClass((String) request.get("dataIntegrityClass"));

        // Installation date and auto-calculate next dates
        if (request.containsKey("installationDate")) {
            LocalDate installDate = LocalDate.parse((String) request.get("installationDate"));
            e.setInstallationDate(installDate);
            if (Boolean.TRUE.equals(e.getCalibrationRequired()) && e.getCalibrationFrequencyDays() != null) {
                e.setNextCalibrationDate(installDate.plusDays(e.getCalibrationFrequencyDays()));
                e.setCalibrationStatus("DUE");
            }
            if (e.getMaintenanceFrequencyDays() != null) {
                e.setNextMaintenanceDate(installDate.plusDays(e.getMaintenanceFrequencyDays()));
            }
        }

        // Owner
        String ownerId = stringValue(request.get("ownerId"));
        if (ownerId != null) {
            e.setOwner(userRepository.getReferenceById(UUID.fromString(ownerId)));
        }

        e.setStatus("ACTIVE");
        e.setQualificationStatus("NOT_QUALIFIED");
        e.setCreatedBy(currentUser);
        e.setUpdatedBy(currentUser);
        e = equipmentRepository.save(e);

        auditTrailService.logAction(RECORD_TYPE, e.getId(), e.getEquipmentNumber(), "CREATED",
                null, null, null, "Equipment registered");

        workflowService.recordStep(RECORD_TYPE, e.getId(), "Registered",
                WorkflowStepStatus.COMPLETED, currentUser, "Equipment created with status ACTIVE", 1);
        workflowService.recordStep(RECORD_TYPE, e.getId(), "Qualification Pending",
                WorkflowStepStatus.CURRENT, currentUser, null, 2);

        return toResponse(e);
    }

    @Transactional
    public EquipmentResponse update(UUID id, Map<String, Object> request) {
        Equipment e = getEntityById(id);
        User currentUser = currentUserProvider.getCurrentUser();
        if (request.containsKey("name")) e.setName((String) request.get("name"));
        if (request.containsKey("description")) e.setDescription((String) request.get("description"));
        if (request.containsKey("manufacturer")) e.setManufacturer((String) request.get("manufacturer"));
        if (request.containsKey("modelNumber")) e.setModelNumber((String) request.get("modelNumber"));
        if (request.containsKey("serialNumber")) e.setSerialNumber((String) request.get("serialNumber"));
        if (request.containsKey("assetTag")) e.setAssetTag((String) request.get("assetTag"));
        if (request.containsKey("area")) e.setArea((String) request.get("area"));
        if (request.containsKey("roomNumber")) e.setRoomNumber((String) request.get("roomNumber"));
        if (request.containsKey("calibrationRequired")) e.setCalibrationRequired((Boolean) request.get("calibrationRequired"));
        if (request.containsKey("calibrationFrequencyDays")) e.setCalibrationFrequencyDays(toInteger(request.get("calibrationFrequencyDays")));
        if (request.containsKey("maintenanceFrequencyDays")) e.setMaintenanceFrequencyDays(toInteger(request.get("maintenanceFrequencyDays")));
        if (request.containsKey("gxpRelevant")) e.setGxpRelevant((Boolean) request.get("gxpRelevant"));
        if (request.containsKey("computerizedSystem")) e.setComputerizedSystem((Boolean) request.get("computerizedSystem"));
        if (request.containsKey("dataIntegrityClass")) e.setDataIntegrityClass((String) request.get("dataIntegrityClass"));

        if (request.containsKey("status")) {
            String newStatus = requireAllowed("status", request.get("status"), VALID_EQUIPMENT_STATUSES);
            String oldStatus = e.getStatus();
            e.setStatus(newStatus);
            auditTrailService.logAction(RECORD_TYPE, e.getId(), e.getEquipmentNumber(), "STATUS_CHANGED",
                    "status", oldStatus, newStatus, null);
        }
        if (request.containsKey("qualificationStatus")) {
            e.setQualificationStatus(allowBlankOrAllowed("qualificationStatus", request.get("qualificationStatus"), VALID_QUALIFICATION_STATUSES));
        }
        if (request.containsKey("calibrationStatus")) {
            e.setCalibrationStatus(allowBlankOrAllowed("calibrationStatus", request.get("calibrationStatus"), VALID_CALIBRATION_STATUSES));
        }
        if (request.containsKey("installationDate")) {
            e.setInstallationDate(LocalDate.parse((String) request.get("installationDate")));
        }
        String ownerId = stringValue(request.get("ownerId"));
        if (ownerId != null) {
            e.setOwner(userRepository.getReferenceById(UUID.fromString(ownerId)));
        }

        e.setUpdatedBy(currentUser);
        return toResponse(equipmentRepository.save(e));
    }

    // =========================================================================
    // Step 2: Qualification Workflow (IQ -> OQ -> PQ)
    // =========================================================================

    @Transactional
    public EquipmentResponse completeQualificationPhase(UUID id, String phase) {
        Equipment e = getEntityById(id);
        User currentUser = currentUserProvider.getCurrentUser();
        String oldQual = e.getQualificationStatus();

        switch (phase.toUpperCase()) {
            case "IQ" -> {
                e.setQualificationStatus("IQ_COMPLETED");
                auditTrailService.logAction(RECORD_TYPE, e.getId(), e.getEquipmentNumber(),
                        "QUALIFICATION_IQ", "qualificationStatus", oldQual, "IQ_COMPLETED", "Installation Qualification completed");
                workflowService.recordStep(RECORD_TYPE, e.getId(), "IQ Completed",
                        WorkflowStepStatus.COMPLETED, currentUser, "Installation Qualification complete", 3);
            }
            case "OQ" -> {
                if (!"IQ_COMPLETED".equals(e.getQualificationStatus())) {
                    throw new IllegalStateException("IQ must be completed before OQ");
                }
                e.setQualificationStatus("OQ_COMPLETED");
                auditTrailService.logAction(RECORD_TYPE, e.getId(), e.getEquipmentNumber(),
                        "QUALIFICATION_OQ", "qualificationStatus", oldQual, "OQ_COMPLETED", "Operational Qualification completed");
                workflowService.recordStep(RECORD_TYPE, e.getId(), "OQ Completed",
                        WorkflowStepStatus.COMPLETED, currentUser, "Operational Qualification complete", 4);
            }
            case "PQ" -> {
                if (!"OQ_COMPLETED".equals(e.getQualificationStatus())) {
                    throw new IllegalStateException("OQ must be completed before PQ");
                }
                e.setQualificationStatus("PQ_COMPLETED");
                e.setQualificationDate(LocalDate.now());
                e.setNextQualificationDate(LocalDate.now().plusMonths(12));
                auditTrailService.logAction(RECORD_TYPE, e.getId(), e.getEquipmentNumber(),
                        "QUALIFICATION_PQ", "qualificationStatus", oldQual, "PQ_COMPLETED",
                        "Performance Qualification completed. Next requalification: " + e.getNextQualificationDate());
                workflowService.recordStep(RECORD_TYPE, e.getId(), "PQ Completed - Equipment Qualified",
                        WorkflowStepStatus.COMPLETED, currentUser, "Equipment fully qualified", 5);
                workflowService.recordStep(RECORD_TYPE, e.getId(), "Equipment Operational",
                        WorkflowStepStatus.CURRENT, currentUser, null, 6);
            }
            default -> throw new IllegalArgumentException("Invalid qualification phase: " + phase + ". Must be IQ, OQ, or PQ");
        }

        e.setUpdatedBy(currentUser);
        return toResponse(equipmentRepository.save(e));
    }

    // =========================================================================
    // Step 3 & 4: Calibration Management
    // =========================================================================

    @Transactional(readOnly = true)
    public List<CalibrationRecordResponse> listCalibrations(UUID equipmentId) {
        return calibrationRepository.findByEquipmentId(equipmentId).stream()
                .map(this::toCalibrationResponse)
                .toList();
    }

    @Transactional
    public CalibrationRecordResponse createCalibration(UUID equipmentId, Map<String, Object> request) {
        Equipment equip = getEntityById(equipmentId);
        User currentUser = currentUserProvider.getCurrentUser();

        CalibrationRecord cr = new CalibrationRecord();
        cr.setCalibrationNumber(sequenceGenerator.generateNumber("CALIBRATION"));
        cr.setEquipment(equip);
        cr.setCalibrationType((String) request.get("calibrationType"));
        cr.setScheduledDate(Instant.parse((String) request.get("scheduledDate")));
        if (request.containsKey("standardUsed")) cr.setStandardUsed((String) request.get("standardUsed"));
        if (request.containsKey("tolerance")) cr.setTolerance((String) request.get("tolerance"));
        if (request.containsKey("standardCertificate")) cr.setStandardCertificate((String) request.get("standardCertificate"));

        cr = calibrationRepository.save(cr);

        // Start Flowable calibration workflow process
        try {
            Map<String, Object> vars = new HashMap<>();
            vars.put("recordId", cr.getId().toString());
            vars.put("calibrationNumber", cr.getCalibrationNumber());
            vars.put("equipmentId", equip.getId().toString());
            vars.put("equipmentName", equip.getName());
            if (equip.getOwner() != null) {
                vars.put("technicianId", equip.getOwner().getId().toString());
            }
            vars.put("calibrationDueDate", cr.getScheduledDate().toString());
            if (equip.getDepartment() != null) {
                vars.put("departmentId", equip.getDepartment().getId().toString());
            }

            String processId = workflowService.startProcess(PROCESS_KEY, cr.getId().toString(), vars);
            log.info("Started calibration workflow {} for {}", processId, cr.getCalibrationNumber());

            workflowService.recordStep(RECORD_TYPE, equip.getId(), "Calibration Scheduled",
                    WorkflowStepStatus.COMPLETED, currentUser,
                    "Calibration " + cr.getCalibrationNumber() + " scheduled", 7);
            workflowService.recordStep(RECORD_TYPE, equip.getId(), "Calibration Execution",
                    WorkflowStepStatus.CURRENT, currentUser, null, 8);
        } catch (Exception e) {
            log.warn("Failed to start calibration workflow for {}: {}", cr.getCalibrationNumber(), e.getMessage());
        }

        auditTrailService.logAction(RECORD_TYPE, equip.getId(), equip.getEquipmentNumber(),
                "CALIBRATION_SCHEDULED", "calibration", null, cr.getCalibrationNumber(),
                "Calibration " + cr.getCalibrationNumber() + " scheduled for " + cr.getScheduledDate());

        return toCalibrationResponse(cr);
    }

    @Transactional
    public CalibrationRecordResponse updateCalibration(UUID id, Map<String, Object> request) {
        CalibrationRecord cr = calibrationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Calibration record not found: " + id));
        Equipment equip = cr.getEquipment();
        User currentUser = currentUserProvider.getCurrentUser();

        String oldStatus = cr.getStatus();
        if (request.containsKey("status")) cr.setStatus((String) request.get("status"));
        if (request.containsKey("result")) cr.setResult((String) request.get("result"));
        if (request.containsKey("asFoundReading")) cr.setAsFoundReading((String) request.get("asFoundReading"));
        if (request.containsKey("asLeftReading")) cr.setAsLeftReading((String) request.get("asLeftReading"));
        if (request.containsKey("tolerance")) cr.setTolerance((String) request.get("tolerance"));
        if (request.containsKey("uncertainty")) cr.setUncertainty((String) request.get("uncertainty"));
        if (request.containsKey("standardUsed")) cr.setStandardUsed((String) request.get("standardUsed"));
        if (request.containsKey("standardCertificate")) cr.setStandardCertificate((String) request.get("standardCertificate"));
        if (request.containsKey("adjustmentMade")) cr.setAdjustmentMade((Boolean) request.get("adjustmentMade"));
        if (request.containsKey("adjustmentDetails")) cr.setAdjustmentDetails((String) request.get("adjustmentDetails"));
        if (request.containsKey("certificatePath")) cr.setCertificatePath((String) request.get("certificatePath"));
        if (request.containsKey("impactAssessmentRequired")) cr.setImpactAssessmentRequired((Boolean) request.get("impactAssessmentRequired"));
        if (request.containsKey("impactOnResults")) cr.setImpactOnResults((String) request.get("impactOnResults"));
        if (request.containsKey("performedDate")) cr.setPerformedDate(Instant.parse((String) request.get("performedDate")));

        // Set performedBy to current user when recording results
        if (request.containsKey("performedDate") && cr.getPerformedBy() == null) {
            cr.setPerformedBy(currentUser);
        }

        // Record calibration execution step
        if ("COMPLETED".equals(cr.getStatus()) || "FAILED".equals(cr.getStatus())) {
            workflowService.recordStep(RECORD_TYPE, equip.getId(), "Calibration Execution",
                    WorkflowStepStatus.COMPLETED, currentUser,
                    "Calibration " + cr.getCalibrationNumber() + " executed. Result: " + cr.getResult(), 8);
            workflowService.recordStep(RECORD_TYPE, equip.getId(), "Calibration QA Review",
                    WorkflowStepStatus.CURRENT, currentUser, null, 9);
        }

        // Handle result-based updates on equipment
        String result = cr.getResult();
        if (result != null && ("COMPLETED".equals(cr.getStatus()) || "FAILED".equals(cr.getStatus()))) {
            if ("PASS".equals(result) || "PASS_WITH_ADJUSTMENT".equals(result)) {
                // Calibration passed
                equip.setCalibrationStatus("CALIBRATED");
                equip.setLastCalibrationDate(LocalDate.now());
                if (equip.getCalibrationFrequencyDays() != null) {
                    LocalDate nextDue = LocalDate.now().plusDays(equip.getCalibrationFrequencyDays());
                    equip.setNextCalibrationDate(nextDue);
                    cr.setNextCalibrationDate(nextDue);
                }
                equip.setUpdatedBy(currentUser);
                equipmentRepository.save(equip);

                auditTrailService.logAction(RECORD_TYPE, equip.getId(), equip.getEquipmentNumber(),
                        "CALIBRATION_PASSED", "calibrationStatus", null, "CALIBRATED",
                        "Calibration " + cr.getCalibrationNumber() + " passed");
            } else if ("FAIL".equals(result) || "OUT_OF_TOLERANCE".equals(result)) {
                // Calibration failed
                cr.setStatus("FAILED");
                equip.setCalibrationStatus("OUT_OF_CALIBRATION");
                equip.setUpdatedBy(currentUser);
                equipmentRepository.save(equip);

                auditTrailService.logAction(RECORD_TYPE, equip.getId(), equip.getEquipmentNumber(),
                        "CALIBRATION_FAILED", "calibrationStatus", null, "OUT_OF_CALIBRATION",
                        "Calibration " + cr.getCalibrationNumber() + " failed - deviation may be required");
            }
        }

        return toCalibrationResponse(calibrationRepository.save(cr));
    }

    @Transactional
    public CalibrationRecordResponse reviewCalibration(UUID calibrationId, Map<String, Object> request) {
        CalibrationRecord cr = calibrationRepository.findById(calibrationId)
                .orElseThrow(() -> new NoSuchElementException("Calibration record not found: " + calibrationId));
        User currentUser = currentUserProvider.getCurrentUser();
        Equipment equip = cr.getEquipment();

        cr.setReviewedBy(currentUser);
        cr.setReviewDate(Instant.now());
        if (request.containsKey("comments")) {
            // Store review comments in adjustment details if needed
        }

        workflowService.recordStep(RECORD_TYPE, equip.getId(), "Calibration QA Review",
                WorkflowStepStatus.COMPLETED, currentUser,
                "Calibration " + cr.getCalibrationNumber() + " reviewed by QA", 9);

        auditTrailService.logAction(RECORD_TYPE, equip.getId(), equip.getEquipmentNumber(),
                "CALIBRATION_REVIEWED", "calibration", null, cr.getCalibrationNumber(),
                "Calibration reviewed by QA");

        return toCalibrationResponse(calibrationRepository.save(cr));
    }

    // =========================================================================
    // Step 5: Preventive Maintenance
    // =========================================================================

    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> listMaintenance(UUID equipmentId) {
        return maintenanceRepository.findByEquipmentIdOrderByScheduledDateDesc(equipmentId).stream()
                .map(this::toMaintenanceResponse)
                .toList();
    }

    @Transactional
    public MaintenanceRecordResponse createMaintenance(UUID equipmentId, Map<String, Object> request) {
        Equipment equip = getEntityById(equipmentId);
        User currentUser = currentUserProvider.getCurrentUser();

        MaintenanceRecord mr = new MaintenanceRecord();
        mr.setMaintenanceNumber(sequenceGenerator.generateNumber("MAINTENANCE"));
        mr.setEquipment(equip);
        mr.setMaintenanceType((String) request.get("maintenanceType"));
        mr.setScheduledDate(Instant.parse((String) request.get("scheduledDate")));
        if (request.containsKey("priority")) mr.setPriority((String) request.get("priority"));

        mr = maintenanceRepository.save(mr);

        auditTrailService.logAction(RECORD_TYPE, equip.getId(), equip.getEquipmentNumber(),
                "MAINTENANCE_SCHEDULED", "maintenance", null, mr.getMaintenanceNumber(),
                mr.getMaintenanceType() + " maintenance scheduled");

        return toMaintenanceResponse(mr);
    }

    @Transactional
    public MaintenanceRecordResponse completeMaintenance(UUID maintenanceId, Map<String, Object> request) {
        MaintenanceRecord mr = maintenanceRepository.findById(maintenanceId)
                .orElseThrow(() -> new NoSuchElementException("Maintenance record not found: " + maintenanceId));
        Equipment equip = mr.getEquipment();
        User currentUser = currentUserProvider.getCurrentUser();

        mr.setStatus("COMPLETED");
        mr.setCompletedDate(Instant.now());
        mr.setPerformedBy(currentUser);
        if (request.containsKey("workPerformed")) mr.setWorkPerformed((String) request.get("workPerformed"));
        if (request.containsKey("partsReplaced")) mr.setPartsReplaced((String) request.get("partsReplaced"));
        if (request.containsKey("downtimeHours")) mr.setDowntimeHours(new BigDecimal(request.get("downtimeHours").toString()));
        if (request.containsKey("impactOnProduction")) mr.setImpactOnProduction((Boolean) request.get("impactOnProduction"));
        if (request.containsKey("requalificationRequired")) mr.setRequalificationRequired((Boolean) request.get("requalificationRequired"));

        // Update equipment maintenance dates
        equip.setLastMaintenanceDate(LocalDate.now());
        if (equip.getMaintenanceFrequencyDays() != null) {
            LocalDate nextMaint = LocalDate.now().plusDays(equip.getMaintenanceFrequencyDays());
            equip.setNextMaintenanceDate(nextMaint);
            mr.setNextMaintenanceDate(nextMaint);
        }
        equip.setUpdatedBy(currentUser);
        equipmentRepository.save(equip);

        auditTrailService.logAction(RECORD_TYPE, equip.getId(), equip.getEquipmentNumber(),
                "MAINTENANCE_COMPLETED", "maintenance", null, mr.getMaintenanceNumber(),
                mr.getMaintenanceType() + " maintenance completed");

        return toMaintenanceResponse(maintenanceRepository.save(mr));
    }

    @Transactional
    public MaintenanceRecordResponse reportBreakdown(UUID maintenanceId) {
        MaintenanceRecord mr = maintenanceRepository.findById(maintenanceId)
                .orElseThrow(() -> new NoSuchElementException("Maintenance record not found: " + maintenanceId));
        Equipment equip = mr.getEquipment();
        User currentUser = currentUserProvider.getCurrentUser();

        mr.setStatus("COMPLETED");
        mr.setCompletedDate(Instant.now());
        mr.setPerformedBy(currentUser);
        mr.setWorkPerformed("Breakdown detected during maintenance inspection");
        mr.setImpactOnProduction(true);

        equip.setStatus("OUT_OF_SERVICE");
        equip.setUpdatedBy(currentUser);
        equipmentRepository.save(equip);

        auditTrailService.logAction(RECORD_TYPE, equip.getId(), equip.getEquipmentNumber(),
                "BREAKDOWN_DETECTED", "status", "ACTIVE", "OUT_OF_SERVICE",
                "Equipment breakdown detected during maintenance - deviation required");

        return toMaintenanceResponse(maintenanceRepository.save(mr));
    }

    // =========================================================================
    // Step 6: Re-qualification
    // =========================================================================

    @Transactional
    public EquipmentResponse startRequalification(UUID id) {
        Equipment e = getEntityById(id);
        User currentUser = currentUserProvider.getCurrentUser();
        String oldQual = e.getQualificationStatus();

        e.setQualificationStatus("REQUALIFICATION_IN_PROGRESS");
        e.setUpdatedBy(currentUser);

        auditTrailService.logAction(RECORD_TYPE, e.getId(), e.getEquipmentNumber(),
                "REQUALIFICATION_STARTED", "qualificationStatus", oldQual, "REQUALIFICATION_IN_PROGRESS", null);
        workflowService.recordStep(RECORD_TYPE, e.getId(), "Re-qualification Started",
                WorkflowStepStatus.CURRENT, currentUser, "Periodic re-qualification initiated", 10);

        return toResponse(equipmentRepository.save(e));
    }

    @Transactional
    public EquipmentResponse completeRequalification(UUID id) {
        Equipment e = getEntityById(id);
        User currentUser = currentUserProvider.getCurrentUser();

        if (!"REQUALIFICATION_IN_PROGRESS".equals(e.getQualificationStatus())) {
            throw new IllegalStateException("Re-qualification must be in progress");
        }

        e.setQualificationStatus("FULLY_QUALIFIED");
        e.setQualificationDate(LocalDate.now());
        e.setNextQualificationDate(LocalDate.now().plusMonths(12));
        e.setUpdatedBy(currentUser);

        auditTrailService.logAction(RECORD_TYPE, e.getId(), e.getEquipmentNumber(),
                "REQUALIFICATION_COMPLETED", "qualificationStatus", "REQUALIFICATION_IN_PROGRESS", "FULLY_QUALIFIED",
                "Next requalification due: " + e.getNextQualificationDate());
        workflowService.recordStep(RECORD_TYPE, e.getId(), "Re-qualification Completed",
                WorkflowStepStatus.COMPLETED, currentUser, "Equipment re-qualified for 12 months", 11);
        workflowService.recordStep(RECORD_TYPE, e.getId(), "Equipment Operational",
                WorkflowStepStatus.CURRENT, currentUser, null, 12);

        return toResponse(equipmentRepository.save(e));
    }

    // =========================================================================
    // Step 7: Decommission
    // =========================================================================

    @Transactional
    public EquipmentResponse decommission(UUID id, Map<String, Object> request) {
        Equipment e = getEntityById(id);
        User currentUser = currentUserProvider.getCurrentUser();
        String oldStatus = e.getStatus();

        e.setStatus("DECOMMISSIONED");
        e.setDecommissionDate(LocalDate.now());
        e.setUpdatedBy(currentUser);

        auditTrailService.logAction(RECORD_TYPE, e.getId(), e.getEquipmentNumber(),
                "DECOMMISSIONED", "status", oldStatus, "DECOMMISSIONED",
                request.containsKey("reason") ? (String) request.get("reason") : "Equipment decommissioned");
        workflowService.recordStep(RECORD_TYPE, e.getId(), "Decommissioned",
                WorkflowStepStatus.COMPLETED, currentUser,
                "Equipment decommissioned. Change Control may be required for GxP equipment.", 20);

        return toResponse(equipmentRepository.save(e));
    }

    // =========================================================================
    // Workflow History & Dashboard
    // =========================================================================

    @Transactional(readOnly = true)
    public List<WorkflowHistoryResponse> getWorkflowHistory(UUID equipmentId) {
        return workflowService.getHistory(RECORD_TYPE, equipmentId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalEquipment", equipmentRepository.count());
        m.put("calibrationOverdue", equipmentRepository.countCalibrationOverdue());
        m.put("maintenanceDue", equipmentRepository.findMaintenanceDue(LocalDate.now().plusDays(7)).size());
        m.put("byStatus", equipmentRepository.countByStatusGrouped());
        m.put("byType", equipmentRepository.countByEquipmentType());
        m.put("calibrationsByStatus", calibrationRepository.countByStatusGrouped());
        m.put("calibrationsByResult", calibrationRepository.countByResult());
        m.put("maintenanceByStatus", maintenanceRepository.countByStatusGrouped());
        return m;
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private Equipment getEntityById(UUID id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Equipment not found: " + id));
    }

    private EquipmentResponse toResponse(Equipment e) {
        PlantSite site = e.getPlantSite();
        Department dept = e.getDepartment();
        User owner = e.getOwner();
        return EquipmentResponse.builder()
                .id(e.getId())
                .equipmentNumber(e.getEquipmentNumber())
                .name(e.getName())
                .description(e.getDescription())
                .equipmentType(e.getEquipmentType())
                .category(e.getCategory())
                .status(e.getStatus())
                .manufacturer(e.getManufacturer())
                .modelNumber(e.getModelNumber())
                .serialNumber(e.getSerialNumber())
                .assetTag(e.getAssetTag())
                .plantSite(site != null ? EquipmentResponse.PlantSiteSummary.builder()
                        .id(site.getId()).name(site.getName()).code(site.getCode()).build() : null)
                .department(dept != null ? EquipmentResponse.DepartmentSummary.builder()
                        .id(dept.getId()).name(dept.getName()).code(dept.getCode()).build() : null)
                .area(e.getArea())
                .roomNumber(e.getRoomNumber())
                .installationDate(e.getInstallationDate())
                .commissioningDate(e.getCommissioningDate())
                .qualificationDate(e.getQualificationDate())
                .nextQualificationDate(e.getNextQualificationDate())
                .qualificationStatus(e.getQualificationStatus())
                .calibrationRequired(e.getCalibrationRequired())
                .calibrationFrequencyDays(e.getCalibrationFrequencyDays())
                .lastCalibrationDate(e.getLastCalibrationDate())
                .nextCalibrationDate(e.getNextCalibrationDate())
                .calibrationStatus(e.getCalibrationStatus())
                .maintenanceFrequencyDays(e.getMaintenanceFrequencyDays())
                .lastMaintenanceDate(e.getLastMaintenanceDate())
                .nextMaintenanceDate(e.getNextMaintenanceDate())
                .owner(toUserRef(owner))
                .gxpRelevant(e.getGxpRelevant())
                .computerizedSystem(e.getComputerizedSystem())
                .dataIntegrityClass(e.getDataIntegrityClass())
                .decommissionDate(e.getDecommissionDate())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private CalibrationRecordResponse toCalibrationResponse(CalibrationRecord cr) {
        Equipment equipment = cr.getEquipment();
        Deviation deviation = cr.getDeviation();
        return CalibrationRecordResponse.builder()
                .id(cr.getId())
                .calibrationNumber(cr.getCalibrationNumber())
                .equipmentId(equipment != null ? equipment.getId() : null)
                .equipmentNumber(equipment != null ? equipment.getEquipmentNumber() : null)
                .equipmentName(equipment != null ? equipment.getName() : null)
                .calibrationType(cr.getCalibrationType())
                .status(cr.getStatus())
                .scheduledDate(cr.getScheduledDate())
                .performedDate(cr.getPerformedDate())
                .performedBy(toUserRef(cr.getPerformedBy()))
                .result(cr.getResult())
                .standardUsed(cr.getStandardUsed())
                .standardCertificate(cr.getStandardCertificate())
                .asFoundReading(cr.getAsFoundReading())
                .asLeftReading(cr.getAsLeftReading())
                .tolerance(cr.getTolerance())
                .uncertainty(cr.getUncertainty())
                .adjustmentMade(cr.getAdjustmentMade())
                .adjustmentDetails(cr.getAdjustmentDetails())
                .reviewedBy(toUserRef(cr.getReviewedBy()))
                .reviewDate(cr.getReviewDate())
                .nextCalibrationDate(cr.getNextCalibrationDate())
                .impactAssessmentRequired(cr.getImpactAssessmentRequired())
                .impactOnResults(cr.getImpactOnResults())
                .deviationId(deviation != null ? deviation.getId() : null)
                .certificatePath(cr.getCertificatePath())
                .createdAt(cr.getCreatedAt())
                .updatedAt(cr.getUpdatedAt())
                .build();
    }

    private MaintenanceRecordResponse toMaintenanceResponse(MaintenanceRecord mr) {
        Equipment equipment = mr.getEquipment();
        Deviation deviation = mr.getDeviation();
        return MaintenanceRecordResponse.builder()
                .id(mr.getId())
                .maintenanceNumber(mr.getMaintenanceNumber())
                .equipmentId(equipment != null ? equipment.getId() : null)
                .equipmentNumber(equipment != null ? equipment.getEquipmentNumber() : null)
                .equipmentName(equipment != null ? equipment.getName() : null)
                .maintenanceType(mr.getMaintenanceType())
                .status(mr.getStatus())
                .priority(mr.getPriority())
                .scheduledDate(mr.getScheduledDate())
                .completedDate(mr.getCompletedDate())
                .performedBy(toUserRef(mr.getPerformedBy()))
                .workPerformed(mr.getWorkPerformed())
                .partsReplaced(mr.getPartsReplaced())
                .nextMaintenanceDate(mr.getNextMaintenanceDate())
                .downtimeHours(mr.getDowntimeHours())
                .impactOnProduction(mr.getImpactOnProduction())
                .requalificationRequired(mr.getRequalificationRequired())
                .deviationId(deviation != null ? deviation.getId() : null)
                .createdAt(mr.getCreatedAt())
                .updatedAt(mr.getUpdatedAt())
                .build();
    }

    private UserRef toUserRef(User user) {
        if (user == null) return null;
        return UserRef.builder()
                .id(user.getId())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .build();
    }

    private String stringValue(Object value) {
        if (value == null) return null;
        String string = value.toString().trim();
        return string.isEmpty() ? null : string;
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        return Integer.parseInt(value.toString());
    }

    private String allowBlankOrAllowed(String field, Object value, Set<String> allowedValues) {
        String string = stringValue(value);
        if (string == null) return null;
        return requireAllowed(field, string, allowedValues);
    }

    private String requireAllowed(String field, Object value, Set<String> allowedValues) {
        String string = stringValue(value);
        if (string == null || !allowedValues.contains(string)) {
            throw new IllegalArgumentException("Invalid " + field + ". Allowed values: " + allowedValues);
        }
        return string;
    }
}
