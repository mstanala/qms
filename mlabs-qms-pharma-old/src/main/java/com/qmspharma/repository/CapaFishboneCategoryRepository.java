package com.qmspharma.repository;

import com.qmspharma.model.entity.CapaFishboneCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CapaFishboneCategoryRepository extends JpaRepository<CapaFishboneCategory, UUID> {
    List<CapaFishboneCategory> findByRcaId(UUID rcaId);
}
