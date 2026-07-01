package com.qmspharma.repository;

import com.qmspharma.model.entity.Audit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuditRepository extends JpaRepository<Audit, UUID>, JpaSpecificationExecutor<Audit> {
    Optional<Audit> findByAuditNumber(String auditNumber);
    long countByStatus(String status);
    List<Audit> findByAuditPlanId(UUID auditPlanId);

    @Query("SELECT a.status, COUNT(a) FROM Audit a GROUP BY a.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT a.auditType, COUNT(a) FROM Audit a GROUP BY a.auditType")
    List<Object[]> countByAuditType();

    @Query("SELECT COUNT(a) FROM Audit a WHERE a.status NOT IN ('COMPLETED', 'CANCELLED') AND a.scheduledEndDate < CURRENT_TIMESTAMP")
    long countOverdue();
}
