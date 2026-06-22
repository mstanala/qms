package com.qmspharma.repository;

import com.qmspharma.model.entity.DocumentReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentReferenceRepository extends JpaRepository<DocumentReference, UUID> {
    List<DocumentReference> findBySourceDocumentId(UUID sourceDocumentId);
    List<DocumentReference> findByTargetDocumentId(UUID targetDocumentId);
}