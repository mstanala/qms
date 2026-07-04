package com.qmspharma.repository;

import com.qmspharma.model.entity.RecordComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RecordCommentRepository extends JpaRepository<RecordComment, UUID> {
    List<RecordComment> findByRecordTypeAndRecordIdOrderByCreatedAtDesc(String recordType, UUID recordId);
}
