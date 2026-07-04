package com.qmspharma.config;

import com.google.protobuf.ByteString;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.support.DefaultConversionService;
import org.springframework.core.env.ConfigurableEnvironment;

public class SecretManagerConfig implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        DefaultConversionService conversionService = (DefaultConversionService) DefaultConversionService.getSharedInstance();
        conversionService.addConverter(new ByteStringToStringConverter());
    }

    private static class ByteStringToStringConverter implements Converter<ByteString, String> {
        @Override
        public String convert(ByteString source) {
            return source.toStringUtf8();
        }
    }
}