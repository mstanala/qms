package com.qmspharma.repository;

import com.qmspharma.model.entity.DocumentReview;
import com.qmspharma.model.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentReviewRepository extends JpaRepository<DocumentReview, UUID> {
    List<DocumentReview> findByDocumentId(UUID documentId);
    List<DocumentReview> findByReviewerIdAndStatus(UUID reviewerId, ReviewStatus status);
}