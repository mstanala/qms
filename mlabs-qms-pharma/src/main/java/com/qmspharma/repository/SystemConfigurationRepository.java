package com.qmspharma.repository;

import com.qmspharma.model.entity.SystemConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SystemConfigurationRepository extends JpaRepository<SystemConfiguration, UUID> {
    Optional<SystemConfiguration> findByConfigKeyAndModuleAndPlantSiteIsNull(String configKey, String module);
    Optional<SystemConfiguration> findByConfigKey(String configKey);
    List<SystemConfiguration> findByModule(String module);
}
