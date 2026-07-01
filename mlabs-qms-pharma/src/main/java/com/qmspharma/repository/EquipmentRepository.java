package com.qmspharma.repository;

import com.qmspharma.model.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EquipmentRepository extends JpaRepository<Equipment, UUID>, JpaSpecificationExecutor<Equipment> {
    Optional<Equipment> findByEquipmentNumber(String equipmentNumber);
    long countByStatus(String status);

    @Query("SELECT e.status, COUNT(e) FROM Equipment e GROUP BY e.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT e.equipmentType, COUNT(e) FROM Equipment e GROUP BY e.equipmentType")
    List<Object[]> countByEquipmentType();

    @Query("SELECT e FROM Equipment e WHERE e.calibrationRequired = true AND e.nextCalibrationDate <= :threshold")
    List<Equipment> findCalibrationDue(LocalDate threshold);

    @Query("SELECT e FROM Equipment e WHERE e.nextMaintenanceDate <= :threshold")
    List<Equipment> findMaintenanceDue(LocalDate threshold);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.calibrationRequired = true AND e.nextCalibrationDate < CURRENT_DATE")
    long countCalibrationOverdue();
}
