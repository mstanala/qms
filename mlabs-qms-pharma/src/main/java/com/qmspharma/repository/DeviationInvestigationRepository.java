package com.qmspharma.repository;

import com.qmspharma.model.entity.DeviationInvestigation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface DeviationInvestigationRepository extends JpaRepository<DeviationInvestigation, UUID> {
    Optional<DeviationInvestigation> findByDeviationId(UUID deviationId);
}
