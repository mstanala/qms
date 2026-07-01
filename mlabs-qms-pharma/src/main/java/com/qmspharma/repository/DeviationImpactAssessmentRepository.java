package com.qmspharma.repository;

import com.qmspharma.model.entity.DeviationImpactAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface DeviationImpactAssessmentRepository extends JpaRepository<DeviationImpactAssessment, UUID> {
    Optional<DeviationImpactAssessment> findByDeviationId(UUID deviationId);
}
