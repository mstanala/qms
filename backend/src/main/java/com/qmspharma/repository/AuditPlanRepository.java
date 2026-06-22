package com.qmspharma.repository;

import com.qmspharma.model.entity.AuditPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface AuditPlanRepository extends JpaRepository<AuditPlan, UUID>, JpaSpecificationExecutor<AuditPlan> {
    Optional<AuditPlan> findByPlanNumber(String planNumber);
    long countByStatus(String status);
    long countByPlanYear(Integer planYear);
}
