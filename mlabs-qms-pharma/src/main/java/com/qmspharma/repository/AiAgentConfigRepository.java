package com.qmspharma.repository;

import com.qmspharma.model.entity.AiAgentConfig;
import com.qmspharma.model.enums.AgentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiAgentConfigRepository extends JpaRepository<AiAgentConfig, UUID> {

    Optional<AiAgentConfig> findByAgentType(AgentType agentType);

    List<AiAgentConfig> findByIsEnabledTrue();

    List<AiAgentConfig> findAllByOrderByAgentTypeAsc();
}
