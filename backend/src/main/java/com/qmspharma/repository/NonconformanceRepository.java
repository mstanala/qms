package com.qmspharma.repository;

import com.qmspharma.model.entity.Nonconformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NonconformanceRepository extends JpaRepository<Nonconformance, UUID>, JpaSpecificationExecutor<Nonconformance> {
    Optional<Nonconformance> findByNcNumber(String ncNumber);
    long countByStatus(String status);

    @Query("SELECT n.status, COUNT(n) FROM Nonconformance n GROUP BY n.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT n.ncType, COUNT(n) FROM Nonconformance n GROUP BY n.ncType")
    List<Object[]> countByNcType();

    @Query("SELECT COUNT(n) FROM Nonconformance n WHERE n.holdStatus = 'HOLD'")
    long countOnHold();

    @Query("SELECT n.dispositionDecision, COUNT(n) FROM Nonconformance n WHERE n.dispositionDecision IS NOT NULL GROUP BY n.dispositionDecision")
    List<Object[]> countByDisposition();
}
