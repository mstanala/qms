package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeTrainingRequirement;
import com.qmspharma.model.enums.CompletionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChangeTrainingRequirementRepository extends JpaRepository<ChangeTrainingRequirement, UUID> {
    List<ChangeTrainingRequirement> findByChangeRequestId(UUID changeRequestId);
    long countByChangeRequestIdAndCompletionStatusNot(UUID changeRequestId, CompletionStatus status);
}
