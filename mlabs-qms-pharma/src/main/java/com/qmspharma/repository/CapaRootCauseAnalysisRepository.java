package com.qmspharma.repository;

import com.qmspharma.model.entity.CapaRootCauseAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface CapaRootCauseAnalysisRepository extends JpaRepository<CapaRootCauseAnalysis, UUID> {
    Optional<CapaRootCauseAnalysis> findByCapaId(UUID capaId);
}
