package com.qmspharma.repository;

import com.qmspharma.model.entity.AiPromptTemplate;
import com.qmspharma.model.enums.AgentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiPromptTemplateRepository extends JpaRepository<AiPromptTemplate, UUID> {

    Optional<AiPromptTemplate> findByAgentTypeAndIsActiveTrue(AgentType agentType);

    Optional<AiPromptTemplate> findByNameAndIsActiveTrue(String name);
}
