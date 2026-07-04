package com.qmspharma.repository;

import com.qmspharma.model.entity.Deviation;
import com.qmspharma.model.enums.DeviationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface DeviationRepository extends JpaRepository<Deviation, UUID>, JpaSpecificationExecutor<Deviation> {
    Optional<Deviation> findByDeviationNumber(String deviationNumber);
    long countByStatus(DeviationStatus status);

    @Query("SELECT COUNT(d) FROM Deviation d WHERE d.status NOT IN ('CLOSED', 'REJECTED') AND d.targetClosureDate < CURRENT_TIMESTAMP")
    long countOverdue();

    @Query("SELECT d.status, COUNT(d) FROM Deviation d GROUP BY d.status")
    java.util.List<Object[]> countByStatusGrouped();

    @Query("SELECT d.classification, COUNT(d) FROM Deviation d WHERE d.classification IS NOT NULL GROUP BY d.classification")
    java.util.List<Object[]> countByClassification();

    @Query("SELECT d.category, COUNT(d) FROM Deviation d GROUP BY d.category")
    java.util.List<Object[]> countByCategory();

    @Query("SELECT d.department.name, COUNT(d) FROM Deviation d GROUP BY d.department.name")
    java.util.List<Object[]> countByDepartment();
}
