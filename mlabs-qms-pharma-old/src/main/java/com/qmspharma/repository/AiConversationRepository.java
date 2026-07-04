package com.qmspharma.repository;

import com.qmspharma.model.entity.AiConversation;
import com.qmspharma.model.enums.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {

    Page<AiConversation> findByUserIdAndStatusOrderByUpdatedAtDesc(UUID userId, ConversationStatus status, Pageable pageable);

    Page<AiConversation> findByUserIdAndStatusNotOrderByUpdatedAtDesc(UUID userId, ConversationStatus status, Pageable pageable);

    long countByUserIdAndStatus(UUID userId, ConversationStatus status);

    Page<AiConversation> findByUserIdAndRecordTypeAndRecordIdOrderByUpdatedAtDesc(
            UUID userId, String recordType, UUID recordId, Pageable pageable);
}
