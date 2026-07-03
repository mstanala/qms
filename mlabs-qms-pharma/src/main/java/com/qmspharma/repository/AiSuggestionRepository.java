package com.qmspharma.repository;

import com.qmspharma.model.entity.AiSuggestion;
import com.qmspharma.model.enums.AgentType;
import com.qmspharma.model.enums.AiSuggestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AiSuggestionRepository extends JpaRepository<AiSuggestion, UUID> {

    Page<AiSuggestion> findByStatusOrderByCreatedAtDesc(AiSuggestionStatus status, Pageable pageable);

    Page<AiSuggestion> findByAssignedToIdAndStatusOrderByCreatedAtDesc(
            UUID assignedToId, AiSuggestionStatus status, Pageable pageable);

    Page<AiSuggestion> findBySourceModuleAndSourceRecordIdOrderByCreatedAtDesc(
            String sourceModule, UUID sourceRecordId, Pageable pageable);

    Page<AiSuggestion> findByAgentTypeAndStatusOrderByCreatedAtDesc(
            AgentType agentType, AiSuggestionStatus status, Pageable pageable);

    long countByStatus(AiSuggestionStatus status);

    long countByAssignedToIdAndStatus(UUID assignedToId, AiSuggestionStatus status);

    @Query("SELECT s.agentType, s.status, COUNT(s) FROM AiSuggestion s GROUP BY s.agentType, s.status")
    List<Object[]> countByAgentTypeAndStatusGrouped();

    @Modifying
    @Query("UPDATE AiSuggestion s SET s.status = 'EXPIRED', s.updatedAt = :now " +
           "WHERE s.status = 'PENDING' AND s.autoExpireAt IS NOT NULL AND s.autoExpireAt < :now")
    int expirePendingSuggestions(@Param("now") Instant now);
}
