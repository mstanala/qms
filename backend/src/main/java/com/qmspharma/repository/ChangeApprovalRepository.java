package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeApproval;
import com.qmspharma.model.enums.ApprovalDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChangeApprovalRepository extends JpaRepository<ChangeApproval, UUID> {
    List<ChangeApproval> findByChangeRequestIdOrderByApprovalOrderAsc(UUID changeRequestId);
    long countByChangeRequestIdAndDecision(UUID changeRequestId, ApprovalDecision decision);
}
