package com.qmspharma.repository;

import com.qmspharma.model.entity.DeviationDisposition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface DeviationDispositionRepository extends JpaRepository<DeviationDisposition, UUID> {
    Optional<DeviationDisposition> findByDeviationId(UUID deviationId);
}
