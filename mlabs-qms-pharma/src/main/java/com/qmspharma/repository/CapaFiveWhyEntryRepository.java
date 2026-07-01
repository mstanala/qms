package com.qmspharma.repository;

import com.qmspharma.model.entity.CapaFiveWhyEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CapaFiveWhyEntryRepository extends JpaRepository<CapaFiveWhyEntry, UUID> {
    List<CapaFiveWhyEntry> findByRcaIdOrderByLevelAsc(UUID rcaId);
}
