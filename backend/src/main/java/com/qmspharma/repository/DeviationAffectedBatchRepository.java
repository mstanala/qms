package com.qmspharma.repository;

import com.qmspharma.model.entity.DeviationAffectedBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DeviationAffectedBatchRepository extends JpaRepository<DeviationAffectedBatch, UUID> {
    List<DeviationAffectedBatch> findByDeviationId(UUID deviationId);
}
