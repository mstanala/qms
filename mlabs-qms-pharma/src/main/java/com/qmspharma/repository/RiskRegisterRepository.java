package com.qmspharma.repository;

import com.qmspharma.model.entity.RiskRegister;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface RiskRegisterRepository extends JpaRepository<RiskRegister, UUID>, JpaSpecificationExecutor<RiskRegister> {
    Optional<RiskRegister> findByRegisterNumber(String registerNumber);
    long countByStatus(String status);

    @Query("SELECT r.status, COUNT(r) FROM RiskRegister r GROUP BY r.status")
    java.util.List<Object[]> countByStatusGrouped();

    @Query("SELECT r.riskType, COUNT(r) FROM RiskRegister r GROUP BY r.riskType")
    java.util.List<Object[]> countByRiskType();

    @Query("SELECT r.methodology, COUNT(r) FROM RiskRegister r GROUP BY r.methodology")
    java.util.List<Object[]> countByMethodology();
}
