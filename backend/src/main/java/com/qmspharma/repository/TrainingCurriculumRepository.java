package com.qmspharma.repository;

import com.qmspharma.model.entity.TrainingCurriculum;
import com.qmspharma.model.enums.CurriculumStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingCurriculumRepository extends JpaRepository<TrainingCurriculum, UUID>, JpaSpecificationExecutor<TrainingCurriculum> {

    long countByStatus(CurriculumStatus status);

    @Query("SELECT c.category AS cat, COUNT(c) AS cnt FROM TrainingCurriculum c WHERE c.status = 'ACTIVE' GROUP BY c.category")
    List<Object[]> countByCategory();
}