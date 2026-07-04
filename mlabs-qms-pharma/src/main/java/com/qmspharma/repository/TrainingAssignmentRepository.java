package com.qmspharma.repository;

import com.qmspharma.model.entity.TrainingAssignment;
import com.qmspharma.model.enums.TrainingAssignmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingAssignmentRepository extends JpaRepository<TrainingAssignment, UUID>, JpaSpecificationExecutor<TrainingAssignment> {

    Page<TrainingAssignment> findByAssignedToId(UUID userId, Pageable pageable);

    long countByStatus(TrainingAssignmentStatus status);

    List<TrainingAssignment> findByCurriculumId(UUID curriculumId);

    boolean existsByCurriculumIdAndAssignedToIdAndStatusNot(UUID curriculumId, UUID assignedToId, TrainingAssignmentStatus status);

    boolean existsByCurriculumIdAndAssignedToIdAndStatusIn(UUID curriculumId, UUID assignedToId, List<TrainingAssignmentStatus> statuses);

    @Query("SELECT a.status AS s, COUNT(a) AS cnt FROM TrainingAssignment a GROUP BY a.status")
    List<Object[]> countByStatus();
}