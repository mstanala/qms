package com.qmspharma.repository;

import com.qmspharma.model.entity.CapaRiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface CapaRiskAssessmentRepository extends JpaRepository<CapaRiskAssessment, UUID> {
    Optional<CapaRiskAssessment> findByCapaId(UUID capaId);
}
