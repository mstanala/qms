package com.qmspharma.config;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class AiConfig {

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    @Value("${ai.openai.model:gpt-5-mini}")
    private String defaultModel;

    @Value("${ai.enabled:true}")
    private boolean aiEnabled;

    @Bean
    public OpenAIClient openAIClient() {
        if (openaiApiKey == null || openaiApiKey.isBlank()) {
            log.warn("OpenAI API key not configured. AI features will be disabled.");
            return null;
        }
        log.info("Initializing OpenAI client with model: {}", defaultModel);
        return OpenAIOkHttpClient.builder()
                .apiKey(openaiApiKey)
                .build();
    }

    public String getDefaultModel() {
        return defaultModel;
    }

    public boolean isAiEnabled() {
        return aiEnabled && openaiApiKey != null && !openaiApiKey.isBlank();
    }
}
