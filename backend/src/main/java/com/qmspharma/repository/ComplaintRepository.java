package com.qmspharma.repository;

import com.qmspharma.model.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID>, JpaSpecificationExecutor<Complaint> {
    Optional<Complaint> findByComplaintNumber(String complaintNumber);
    long countByStatus(String status);

    @Query("SELECT c.status, COUNT(c) FROM Complaint c GROUP BY c.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT c.complaintType, COUNT(c) FROM Complaint c GROUP BY c.complaintType")
    List<Object[]> countByComplaintType();

    @Query("SELECT c.classification, COUNT(c) FROM Complaint c WHERE c.classification IS NOT NULL GROUP BY c.classification")
    List<Object[]> countByClassification();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.isAdverseEvent = true AND c.adverseEventReported = false")
    long countUnreportedAdverseEvents();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status NOT IN ('CLOSED', 'REJECTED') AND c.responseDueDate < CURRENT_TIMESTAMP")
    long countOverdue();
}
