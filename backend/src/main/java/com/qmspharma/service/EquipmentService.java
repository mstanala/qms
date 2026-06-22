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
public class EquipmentService {

    private static final String RECORD_TYPE = "EQUIPMENT";

    private final EquipmentRepository equipmentRepository;
    private final CalibrationRecordRepository calibrationRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<Equipment> list(String status, String equipmentType, UUID plantSiteId, String search, Pageable pageable) {
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
        return equipmentRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Equipment getById(UUID id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Equipment not found: " + id));
    }

    @Transactional
    public Equipment create(Map<String, Object> request) {
        User currentUser = currentUserProvider.getCurrentUser();
        Equipment e = new Equipment();
        e.setEquipmentNumber(sequenceGenerator.generateNumber("EQUIPMENT"));
        e.setName((String) request.get("name"));
        e.setDescription((String) request.get("description"));
        e.setEquipmentType((String) request.get("equipmentType"));
        e.setCategory((String) request.get("category"));
        e.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString((String) request.get("plantSiteId"))));
        if (request.containsKey("departmentId")) {
            e.setDepartment(departmentRepository.getReferenceById(UUID.fromString((String) request.get("departmentId"))));
        }
        if (request.containsKey("manufacturer")) e.setManufacturer((String) request.get("manufacturer"));
        if (request.containsKey("modelNumber")) e.setModelNumber((String) request.get("modelNumber"));
        if (request.containsKey("serialNumber")) e.setSerialNumber((String) request.get("serialNumber"));
        if (request.containsKey("calibrationRequired")) e.setCalibrationRequired((Boolean) request.get("calibrationRequired"));
        if (request.containsKey("calibrationFrequencyDays")) e.setCalibrationFrequencyDays((Integer) request.get("calibrationFrequencyDays"));
        e.setCreatedBy(currentUser);
        e.setUpdatedBy(currentUser);
        return equipmentRepository.save(e);
    }

    @Transactional
    public Equipment update(UUID id, Map<String, Object> request) {
        Equipment e = getById(id);
        if (request.containsKey("name")) e.setName((String) request.get("name"));
        if (request.containsKey("status")) e.setStatus((String) request.get("status"));
        if (request.containsKey("qualificationStatus")) e.setQualificationStatus((String) request.get("qualificationStatus"));
        if (request.containsKey("calibrationStatus")) e.setCalibrationStatus((String) request.get("calibrationStatus"));
        e.setUpdatedBy(currentUserProvider.getCurrentUser());
        return equipmentRepository.save(e);
    }

    @Transactional(readOnly = true)
    public List<CalibrationRecord> listCalibrations(UUID equipmentId) {
        return calibrationRepository.findByEquipmentId(equipmentId);
    }

    @Transactional
    public CalibrationRecord createCalibration(UUID equipmentId, Map<String, Object> request) {
        Equipment equip = getById(equipmentId);
        CalibrationRecord cr = new CalibrationRecord();
        cr.setCalibrationNumber(sequenceGenerator.generateNumber("CALIBRATION"));
        cr.setEquipment(equip);
        cr.setCalibrationType((String) request.get("calibrationType"));
        cr.setScheduledDate(Instant.parse((String) request.get("scheduledDate")));
        if (request.containsKey("standardUsed")) cr.setStandardUsed((String) request.get("standardUsed"));
        return calibrationRepository.save(cr);
    }

    @Transactional
    public CalibrationRecord updateCalibration(UUID id, Map<String, Object> request) {
        CalibrationRecord cr = calibrationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Calibration record not found: " + id));
        if (request.containsKey("status")) cr.setStatus((String) request.get("status"));
        if (request.containsKey("result")) cr.setResult((String) request.get("result"));
        if (request.containsKey("asFoundReading")) cr.setAsFoundReading((String) request.get("asFoundReading"));
        if (request.containsKey("asLeftReading")) cr.setAsLeftReading((String) request.get("asLeftReading"));
        if (request.containsKey("performedDate")) cr.setPerformedDate(Instant.parse((String) request.get("performedDate")));
        return calibrationRepository.save(cr);
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
}
