package com.qmspharma.repository;

import com.qmspharma.model.entity.WorkflowHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface WorkflowHistoryRepository extends JpaRepository<WorkflowHistory, UUID> {
    List<WorkflowHistory> findByRecordTypeAndRecordIdOrderByStepOrderAsc(String recordType, UUID recordId);
}
