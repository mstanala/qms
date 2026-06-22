package com.qmspharma.repository;

import com.qmspharma.model.entity.ManagementReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ManagementReviewRepository extends JpaRepository<ManagementReview, UUID>, JpaSpecificationExecutor<ManagementReview> {
    Optional<ManagementReview> findByReviewNumber(String reviewNumber);
    long countByStatus(String status);

    @Query("SELECT mr.status, COUNT(mr) FROM ManagementReview mr GROUP BY mr.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT mr.reviewType, COUNT(mr) FROM ManagementReview mr GROUP BY mr.reviewType")
    List<Object[]> countByReviewType();
}
