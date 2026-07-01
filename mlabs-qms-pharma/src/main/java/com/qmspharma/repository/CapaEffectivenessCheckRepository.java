package com.qmspharma.repository;

import com.qmspharma.model.entity.CapaEffectivenessCheck;
import com.qmspharma.model.enums.EffectivenessResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CapaEffectivenessCheckRepository extends JpaRepository<CapaEffectivenessCheck, UUID> {
    List<CapaEffectivenessCheck> findByCapaId(UUID capaId);
    boolean existsByCapaIdAndResult(UUID capaId, EffectivenessResult result);
}
