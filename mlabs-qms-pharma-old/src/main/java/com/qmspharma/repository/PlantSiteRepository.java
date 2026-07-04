package com.qmspharma.repository;

import com.qmspharma.model.entity.PlantSite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PlantSiteRepository extends JpaRepository<PlantSite, UUID> {
    List<PlantSite> findByOrganizationIdAndIsActiveTrue(UUID organizationId);
    List<PlantSite> findByIsActiveTrue();
}
