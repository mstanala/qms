package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeRegulatoryFiling;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ChangeRegulatoryFilingRepository extends JpaRepository<ChangeRegulatoryFiling, UUID> {
    Optional<ChangeRegulatoryFiling> findByChangeRequestId(UUID changeRequestId);
}
