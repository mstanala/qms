package com.qmspharma.repository;

import com.qmspharma.model.entity.ValidationProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ValidationProjectRepository extends JpaRepository<ValidationProject, UUID>, JpaSpecificationExecutor<ValidationProject> {
    Optional<ValidationProject> findByProjectNumber(String projectNumber);
    long countByStatus(String status);

    @Query("SELECT vp.status, COUNT(vp) FROM ValidationProject vp GROUP BY vp.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT vp.validationType, COUNT(vp) FROM ValidationProject vp GROUP BY vp.validationType")
    List<Object[]> countByValidationType();
}
