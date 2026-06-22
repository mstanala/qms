package com.qmspharma.config;

import org.flowable.spring.SpringProcessEngineConfiguration;
import org.flowable.spring.boot.EngineConfigurationConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlowableConfig {

    @Bean
    public EngineConfigurationConfigurer<SpringProcessEngineConfiguration> engineConfigurer() {
        return config -> {
            config.setActivityFontName("Arial");
            config.setLabelFontName("Arial");
            config.setAnnotationFontName("Arial");
            config.setDatabaseSchemaUpdate("true");
            config.setAsyncExecutorActivate(true);
        };
    }
}