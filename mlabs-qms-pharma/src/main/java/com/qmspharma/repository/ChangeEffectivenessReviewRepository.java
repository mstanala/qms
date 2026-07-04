package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeEffectivenessReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChangeEffectivenessReviewRepository extends JpaRepository<ChangeEffectivenessReview, UUID> {
    List<ChangeEffectivenessReview> findByChangeRequestId(UUID changeRequestId);
}
