package com.qmspharma.repository;

import com.qmspharma.model.entity.TrainingMatrix;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingMatrixRepository extends JpaRepository<TrainingMatrix, UUID> {
    List<TrainingMatrix> findByRoleId(UUID roleId);
    List<TrainingMatrix> findByDepartmentId(UUID departmentId);
    List<TrainingMatrix> findByCurriculumId(UUID curriculumId);
}