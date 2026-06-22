package com.qmspharma.repository;

import com.qmspharma.model.entity.RiskControl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RiskControlRepository extends JpaRepository<RiskControl, UUID> {
    List<RiskControl> findByRiskAssessmentId(UUID riskAssessmentId);
    long countByStatus(String status);
}
