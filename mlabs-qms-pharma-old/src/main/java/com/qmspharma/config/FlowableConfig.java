package com.qmspharma.config;

import org.flowable.spring.SpringProcessEngineConfiguration;
import org.flowable.spring.boot.EngineConfigurationConfigurer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlowableConfig {

    @Value("${flowable.database-schema:#{null}}")
    private String databaseSchema;

    @Bean
    public EngineConfigurationConfigurer<SpringProcessEngineConfiguration> engineConfigurer() {
        return config -> {
            config.setActivityFontName("Arial");
            config.setLabelFontName("Arial");
            config.setAnnotationFontName("Arial");
            config.setDatabaseSchemaUpdate("true");
            config.setAsyncExecutorActivate(true);
            if (databaseSchema != null) {
                config.setDatabaseSchema(databaseSchema);
            }
        };
    }
}