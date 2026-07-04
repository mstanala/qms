package com.qmspharma.repository;

import com.qmspharma.model.entity.Document;
import com.qmspharma.model.enums.DocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID>, JpaSpecificationExecutor<Document> {

    long countByStatus(DocumentStatus status);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.nextReviewDate < :now AND d.status = 'EFFECTIVE'")
    long countOverdueReviews(Instant now);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.nextReviewDate BETWEEN :now AND :threshold AND d.status = 'EFFECTIVE'")
    long countExpiringWithin(Instant now, Instant threshold);

    @Query("SELECT d.documentType AS type, COUNT(d) AS cnt FROM Document d GROUP BY d.documentType")
    List<Object[]> countByType();

    @Query("SELECT d.status AS status, COUNT(d) AS cnt FROM Document d GROUP BY d.status")
    List<Object[]> countByStatus();

    Page<Document> findByOwnerId(UUID ownerId, Pageable pageable);
}