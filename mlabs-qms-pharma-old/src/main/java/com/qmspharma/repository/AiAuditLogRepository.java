package com.qmspharma.repository;

import com.qmspharma.model.entity.AiAuditLog;
import com.qmspharma.model.enums.AgentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AiAuditLogRepository extends JpaRepository<AiAuditLog, UUID> {

    Page<AiAuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<AiAuditLog> findByAgentTypeOrderByCreatedAtDesc(AgentType agentType, Pageable pageable);

    Page<AiAuditLog> findByRecordTypeAndRecordIdOrderByCreatedAtDesc(String recordType, UUID recordId, Pageable pageable);

    Page<AiAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
