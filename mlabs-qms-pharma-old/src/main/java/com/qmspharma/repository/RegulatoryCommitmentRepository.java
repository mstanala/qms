package com.qmspharma.repository;

import com.qmspharma.model.entity.RegulatoryCommitment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegulatoryCommitmentRepository extends JpaRepository<RegulatoryCommitment, UUID>, JpaSpecificationExecutor<RegulatoryCommitment> {
    Optional<RegulatoryCommitment> findByCommitmentNumber(String commitmentNumber);
    long countByStatus(String status);

    @Query("SELECT rc.status, COUNT(rc) FROM RegulatoryCommitment rc GROUP BY rc.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT COUNT(rc) FROM RegulatoryCommitment rc WHERE rc.status NOT IN ('CLOSED', 'VERIFIED', 'COMPLETED') AND rc.dueDate < CURRENT_TIMESTAMP")
    long countOverdue();
}
