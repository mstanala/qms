package com.qmspharma.repository;

import com.qmspharma.model.entity.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, UUID>, JpaSpecificationExecutor<RiskAssessment> {
    Optional<RiskAssessment> findByAssessmentNumber(String assessmentNumber);
    List<RiskAssessment> findByRiskRegisterId(UUID riskRegisterId);
    long countByStatus(String status);

    @Query("SELECT ra.initialRiskLevel, COUNT(ra) FROM RiskAssessment ra GROUP BY ra.initialRiskLevel")
    List<Object[]> countByInitialRiskLevel();

    @Query("SELECT ra.status, COUNT(ra) FROM RiskAssessment ra GROUP BY ra.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT COUNT(ra) FROM RiskAssessment ra WHERE ra.riskAcceptance = 'UNACCEPTABLE'")
    long countUnacceptable();
}
