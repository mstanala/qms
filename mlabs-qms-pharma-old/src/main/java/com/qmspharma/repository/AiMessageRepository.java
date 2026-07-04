package com.qmspharma.repository;

import com.qmspharma.model.entity.AiMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, UUID> {

    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    Page<AiMessage> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    long countByConversationId(UUID conversationId);

    @Query("SELECT COALESCE(SUM(m.tokensUsed), 0) FROM AiMessage m WHERE m.conversation.user.id = :userId")
    long totalTokensByUser(UUID userId);
}
