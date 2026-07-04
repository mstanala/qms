package com.qmspharma.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;

@Configuration
@RequiredArgsConstructor
public class GoogleCloudStorageConfig {

    private final Environment environment;
    private final ResourceLoader resourceLoader;

    @Bean
    @Lazy
    public Storage googleCloudStorage() throws IOException {
        StorageOptions.Builder builder = StorageOptions.newBuilder();
        String projectId = firstText(
                environment.getProperty("google.cloud.project-id"),
                environment.getProperty("gcs.project-id")
        );
        String credentialsLocation = firstText(
                environment.getProperty("google.cloud.credentials-location"),
                environment.getProperty("gcs.credentials-location")
        );

        if (StringUtils.hasText(projectId)) {
            builder.setProjectId(projectId);
        }

        if (StringUtils.hasText(credentialsLocation)) {
            Resource credentials = resourceLoader.getResource(credentialsLocation);
            if (!credentials.exists() && !credentialsLocation.contains(":")) {
                credentials = resourceLoader.getResource("file:" + credentialsLocation);
            }
            try (InputStream inputStream = credentials.getInputStream()) {
                builder.setCredentials(GoogleCredentials.fromStream(inputStream));
            }
        }

        return builder.build().getService();
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }
}
