package com.qmspharma.service;

import com.qmspharma.model.entity.*;
import com.qmspharma.model.dto.response.CalibrationRecordResponse;
import com.qmspharma.model.dto.response.EquipmentResponse;
import com.qmspharma.model.dto.response.UserRef;
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
public class EquipmentService {

    private static final String RECORD_TYPE = "EQUIPMENT";
    private static final Set<String> VALID_EQUIPMENT_STATUSES = Set.of("ACTIVE", "INACTIVE", "OUT_OF_SERVICE", "DECOMMISSIONED");
    private static final Set<String> VALID_QUALIFICATION_STATUSES = Set.of(
            "NOT_QUALIFIED", "IQ_COMPLETED", "OQ_COMPLETED", "PQ_COMPLETED",
            "FULLY_QUALIFIED", "REQUALIFICATION_DUE", "QUALIFICATION_EXPIRED");
    private static final Set<String> VALID_CALIBRATION_STATUSES = Set.of("CALIBRATED", "DUE", "OVERDUE", "NOT_APPLICABLE");

    private final EquipmentRepository equipmentRepository;
    private final CalibrationRecordRepository calibrationRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final CurrentUserProvider currentUserProvider;

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
        if (request.containsKey("calibrationRequired")) e.setCalibrationRequired((Boolean) request.get("calibrationRequired"));
        if (request.containsKey("calibrationFrequencyDays")) e.setCalibrationFrequencyDays((Integer) request.get("calibrationFrequencyDays"));
        e.setCreatedBy(currentUser);
        e.setUpdatedBy(currentUser);
        return toResponse(equipmentRepository.save(e));
    }

    @Transactional
    public EquipmentResponse update(UUID id, Map<String, Object> request) {
        Equipment e = getEntityById(id);
        if (request.containsKey("name")) e.setName((String) request.get("name"));
        if (request.containsKey("status")) e.setStatus(requireAllowed("status", request.get("status"), VALID_EQUIPMENT_STATUSES));
        if (request.containsKey("qualificationStatus")) e.setQualificationStatus(allowBlankOrAllowed("qualificationStatus", request.get("qualificationStatus"), VALID_QUALIFICATION_STATUSES));
        if (request.containsKey("calibrationStatus")) e.setCalibrationStatus(allowBlankOrAllowed("calibrationStatus", request.get("calibrationStatus"), VALID_CALIBRATION_STATUSES));
        e.setUpdatedBy(currentUserProvider.getCurrentUser());
        return toResponse(equipmentRepository.save(e));
    }

    @Transactional(readOnly = true)
    public List<CalibrationRecordResponse> listCalibrations(UUID equipmentId) {
        return calibrationRepository.findByEquipmentId(equipmentId).stream()
                .map(this::toCalibrationResponse)
                .toList();
    }

    @Transactional
    public CalibrationRecordResponse createCalibration(UUID equipmentId, Map<String, Object> request) {
        Equipment equip = getEntityById(equipmentId);
        CalibrationRecord cr = new CalibrationRecord();
        cr.setCalibrationNumber(sequenceGenerator.generateNumber("CALIBRATION"));
        cr.setEquipment(equip);
        cr.setCalibrationType((String) request.get("calibrationType"));
        cr.setScheduledDate(Instant.parse((String) request.get("scheduledDate")));
        if (request.containsKey("standardUsed")) cr.setStandardUsed((String) request.get("standardUsed"));
        return toCalibrationResponse(calibrationRepository.save(cr));
    }

    @Transactional
    public CalibrationRecordResponse updateCalibration(UUID id, Map<String, Object> request) {
        CalibrationRecord cr = calibrationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Calibration record not found: " + id));
        if (request.containsKey("status")) cr.setStatus((String) request.get("status"));
        if (request.containsKey("result")) cr.setResult((String) request.get("result"));
        if (request.containsKey("asFoundReading")) cr.setAsFoundReading((String) request.get("asFoundReading"));
        if (request.containsKey("asLeftReading")) cr.setAsLeftReading((String) request.get("asLeftReading"));
        if (request.containsKey("tolerance")) cr.setTolerance((String) request.get("tolerance"));
        if (request.containsKey("standardUsed")) cr.setStandardUsed((String) request.get("standardUsed"));
        if (request.containsKey("standardCertificate")) cr.setStandardCertificate((String) request.get("standardCertificate"));
        if (request.containsKey("adjustmentMade")) cr.setAdjustmentMade((Boolean) request.get("adjustmentMade"));
        if (request.containsKey("adjustmentDetails")) cr.setAdjustmentDetails((String) request.get("adjustmentDetails"));
        if (request.containsKey("certificatePath")) cr.setCertificatePath((String) request.get("certificatePath"));
        if (request.containsKey("impactAssessmentRequired")) cr.setImpactAssessmentRequired((Boolean) request.get("impactAssessmentRequired"));
        if (request.containsKey("impactOnResults")) cr.setImpactOnResults((String) request.get("impactOnResults"));
        if (request.containsKey("performedDate")) cr.setPerformedDate(Instant.parse((String) request.get("performedDate")));
        return toCalibrationResponse(calibrationRepository.save(cr));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalEquipment", equipmentRepository.count());
        m.put("calibrationOverdue", equipmentRepository.countCalibrationOverdue());
        m.put("byStatus", equipmentRepository.countByStatusGrouped());
        m.put("byType", equipmentRepository.countByEquipmentType());
        m.put("calibrationsByStatus", calibrationRepository.countByStatusGrouped());
        m.put("calibrationsByResult", calibrationRepository.countByResult());
        return m;
    }

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
