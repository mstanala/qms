package com.qmspharma.repository;

import com.qmspharma.model.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findByRecordTypeAndRecordIdAndIsDeletedFalse(String recordType, UUID recordId);
}
