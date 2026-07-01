package com.qmspharma.repository;

import com.qmspharma.model.entity.AuditFinding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuditFindingRepository extends JpaRepository<AuditFinding, UUID> {
    Optional<AuditFinding> findByFindingNumber(String findingNumber);
    List<AuditFinding> findByAuditId(UUID auditId);
    long countByStatus(String status);

    @Query("SELECT af.classification, COUNT(af) FROM AuditFinding af GROUP BY af.classification")
    List<Object[]> countByClassification();

    @Query("SELECT af.status, COUNT(af) FROM AuditFinding af GROUP BY af.status")
    List<Object[]> countByStatusGrouped();
}
