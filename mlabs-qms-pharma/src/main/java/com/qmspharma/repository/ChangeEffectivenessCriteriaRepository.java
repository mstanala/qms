package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeEffectivenessCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChangeEffectivenessCriteriaRepository extends JpaRepository<ChangeEffectivenessCriteria, UUID> {
    List<ChangeEffectivenessCriteria> findByReviewId(UUID reviewId);
}
