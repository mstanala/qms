package com.qmspharma.repository;

import com.qmspharma.model.entity.AiAgentExecution;
import com.qmspharma.model.enums.AgentExecutionStatus;
import com.qmspharma.model.enums.AgentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AiAgentExecutionRepository extends JpaRepository<AiAgentExecution, UUID> {

    Page<AiAgentExecution> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    long countByAgentType(AgentType agentType);

    long countByStatus(AgentExecutionStatus status);

    long countByCreatedAtAfter(Instant since);

    long countByStatusAndRequiresApproval(AgentExecutionStatus status, Boolean requiresApproval);

    @Query("SELECT COALESCE(AVG(e.latencyMs), 0) FROM AiAgentExecution e WHERE e.status = 'COMPLETED'")
    double averageLatency();

    @Query("SELECT e.agentType, COUNT(e) FROM AiAgentExecution e GROUP BY e.agentType")
    java.util.List<Object[]> countByAgentTypeGrouped();

    @Query("SELECT e.status, COUNT(e) FROM AiAgentExecution e GROUP BY e.status")
    java.util.List<Object[]> countByStatusGrouped();
}
