package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeImpactAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ChangeImpactAssessmentRepository extends JpaRepository<ChangeImpactAssessment, UUID> {
    Optional<ChangeImpactAssessment> findByChangeRequestId(UUID changeRequestId);
}
