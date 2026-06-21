package com.qmspharma.repository;

import com.qmspharma.model.entity.CapaAction;
import com.qmspharma.model.enums.ActionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CapaActionRepository extends JpaRepository<CapaAction, UUID> {
    List<CapaAction> findByCapaId(UUID capaId);
    long countByCapaIdAndStatusNot(UUID capaId, ActionStatus status);
    long countByCapaIdAndStatus(UUID capaId, ActionStatus status);
}
