package com.qmspharma.repository;

import com.qmspharma.model.entity.RegulatoryInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegulatoryInspectionRepository extends JpaRepository<RegulatoryInspection, UUID>, JpaSpecificationExecutor<RegulatoryInspection> {
    Optional<RegulatoryInspection> findByInspectionNumber(String inspectionNumber);
    long countByStatus(String status);

    @Query("SELECT ri.status, COUNT(ri) FROM RegulatoryInspection ri GROUP BY ri.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT ri.agency, COUNT(ri) FROM RegulatoryInspection ri GROUP BY ri.agency")
    List<Object[]> countByAgency();
}
