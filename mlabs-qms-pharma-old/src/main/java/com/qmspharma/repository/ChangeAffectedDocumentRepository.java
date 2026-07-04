package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeAffectedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChangeAffectedDocumentRepository extends JpaRepository<ChangeAffectedDocument, UUID> {
    List<ChangeAffectedDocument> findByChangeRequestId(UUID changeRequestId);
}
