package com.qmspharma.repository;

import com.qmspharma.model.entity.DocumentDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentDistributionRepository extends JpaRepository<DocumentDistribution, UUID> {
    List<DocumentDistribution> findByDocumentVersionId(UUID versionId);
    List<DocumentDistribution> findByRecipientId(UUID recipientId);
    boolean existsByDocumentVersionIdAndRecipientId(UUID documentVersionId, UUID recipientId);
}
