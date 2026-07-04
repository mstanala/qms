package com.qmspharma.repository;

import com.qmspharma.model.entity.DocumentApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentApprovalRepository extends JpaRepository<DocumentApproval, UUID> {
    List<DocumentApproval> findByDocumentVersionId(UUID versionId);
}