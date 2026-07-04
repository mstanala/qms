package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeRequest;
import com.qmspharma.model.enums.ChangeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, UUID>, JpaSpecificationExecutor<ChangeRequest> {
    Optional<ChangeRequest> findByChangeNumber(String changeNumber);
    long countByStatus(ChangeStatus status);

    @Query("SELECT COUNT(c) FROM ChangeRequest c WHERE c.status NOT IN ('CLOSED', 'REJECTED', 'WITHDRAWN') AND c.targetImplementationDate < CURRENT_TIMESTAMP")
    long countOverdue();

    @Query("SELECT c.status, COUNT(c) FROM ChangeRequest c GROUP BY c.status")
    java.util.List<Object[]> countByStatusGrouped();

    @Query("SELECT c.type, COUNT(c) FROM ChangeRequest c GROUP BY c.type")
    java.util.List<Object[]> countByType();

    @Query("SELECT c.classification, COUNT(c) FROM ChangeRequest c GROUP BY c.classification")
    java.util.List<Object[]> countByClassification();

    @Query("SELECT c.department.name, COUNT(c) FROM ChangeRequest c GROUP BY c.department.name")
    java.util.List<Object[]> countByDepartment();
}
