package com.qmspharma.repository;

import com.qmspharma.model.entity.DeviationImmediateAction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DeviationImmediateActionRepository extends JpaRepository<DeviationImmediateAction, UUID> {
    List<DeviationImmediateAction> findByInvestigationId(UUID investigationId);
}
