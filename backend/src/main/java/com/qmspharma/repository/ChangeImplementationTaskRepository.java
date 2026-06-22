package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeImplementationTask;
import com.qmspharma.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChangeImplementationTaskRepository extends JpaRepository<ChangeImplementationTask, UUID> {
    List<ChangeImplementationTask> findByChangeRequestId(UUID changeRequestId);
    long countByChangeRequestIdAndStatusNot(UUID changeRequestId, TaskStatus status);
}
