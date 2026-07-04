package com.qmspharma.service.ai;

import com.qmspharma.model.enums.AgentType;
import com.qmspharma.service.ai.agents.BaseAgent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AgentRegistry {

    private final Map<AgentType, BaseAgent> agents = new EnumMap<>(AgentType.class);

    public AgentRegistry(List<BaseAgent> agentBeans) {
        for (BaseAgent agent : agentBeans) {
            agents.put(agent.getAgentType(), agent);
            log.info("Registered AI agent: {} -> {}", agent.getAgentType(), agent.getDisplayName());
        }
        log.info("Total AI agents registered: {}", agents.size());
    }

    public BaseAgent getAgent(AgentType type) {
        BaseAgent agent = agents.get(type);
        if (agent == null) {
            throw new IllegalArgumentException("No agent registered for type: " + type);
        }
        return agent;
    }

    public Map<AgentType, BaseAgent> getAllAgents() {
        return Map.copyOf(agents);
    }

    public boolean hasAgent(AgentType type) {
        return agents.containsKey(type);
    }
}
