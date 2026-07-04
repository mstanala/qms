package com.qmspharma.repository;

import com.qmspharma.model.entity.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, UUID> {
    Optional<MaintenanceRecord> findByMaintenanceNumber(String maintenanceNumber);
    List<MaintenanceRecord> findByEquipmentIdOrderByScheduledDateDesc(UUID equipmentId);
    long countByStatus(String status);

    @Query("SELECT mr.status, COUNT(mr) FROM MaintenanceRecord mr GROUP BY mr.status")
    List<Object[]> countByStatusGrouped();
}
