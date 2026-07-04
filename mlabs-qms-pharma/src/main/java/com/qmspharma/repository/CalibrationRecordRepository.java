package com.qmspharma.repository;

import com.qmspharma.model.entity.CalibrationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CalibrationRecordRepository extends JpaRepository<CalibrationRecord, UUID>, JpaSpecificationExecutor<CalibrationRecord> {
    Optional<CalibrationRecord> findByCalibrationNumber(String calibrationNumber);
    List<CalibrationRecord> findByEquipmentId(UUID equipmentId);
    long countByStatus(String status);

    @Query("SELECT cr.status, COUNT(cr) FROM CalibrationRecord cr GROUP BY cr.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT cr.result, COUNT(cr) FROM CalibrationRecord cr WHERE cr.result IS NOT NULL GROUP BY cr.result")
    List<Object[]> countByResult();
}
