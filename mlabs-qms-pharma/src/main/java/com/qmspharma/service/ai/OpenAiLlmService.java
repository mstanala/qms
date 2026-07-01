package com.qmspharma.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.client.OpenAIClient;
import com.openai.models.ChatModel;
import com.openai.models.FunctionDefinition;
import com.openai.models.FunctionParameters;
import com.openai.models.chat.completions.*;
import com.qmspharma.config.AiConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class OpenAiLlmService {

    private final OpenAIClient openAIClient;
    private final AiConfig aiConfig;
    private final ObjectMapper objectMapper;

    public OpenAiLlmService(
            @org.springframework.lang.Nullable OpenAIClient openAIClient,
            AiConfig aiConfig,
            ObjectMapper objectMapper) {
        this.openAIClient = openAIClient;
        this.aiConfig = aiConfig;
        this.objectMapper = objectMapper;
    }

    public LlmResponse chat(String systemPrompt, String userMessage, String model) {
        return chat(systemPrompt, userMessage, model, List.of(), 0.3);
    }

    public LlmResponse chat(String systemPrompt, String userMessage, String model,
                             List<ToolDefinition> tools, double temperature) {
        if (!aiConfig.isAiEnabled()) {
            return LlmResponse.builder()
                    .content("AI features are currently disabled. Please configure the OpenAI API key.")
                    .tokensUsed(0)
                    .model(model)
                    .build();
        }

        long startTime = System.currentTimeMillis();

        try {
            var messages = new ArrayList<ChatCompletionMessageParam>();

            // System message
            messages.add(ChatCompletionMessageParam.ofSystem(
                    ChatCompletionSystemMessageParam.builder()
                            .content(systemPrompt)
                            .build()));

            // User message
            messages.add(ChatCompletionMessageParam.ofUser(
                    ChatCompletionUserMessageParam.builder()
                            .content(userMessage)
                            .build()));

            String resolvedModel = model != null ? model : aiConfig.getDefaultModel();
            var requestBuilder = ChatCompletionCreateParams.builder()
                    .model(ChatModel.of(resolvedModel))
                    .messages(messages);

            // Some models (e.g. gpt-5-mini) only support default temperature (1)
            if (!resolvedModel.contains("gpt-5")) {
                requestBuilder.temperature(temperature);
            }

            // Add tools if provided
            if (tools != null && !tools.isEmpty()) {
                var chatTools = tools.stream()
                        .map(this::toOpenAiTool)
                        .toList();
                requestBuilder.tools(chatTools);
            }

            var completion = openAIClient.chat().completions().create(requestBuilder.build());

            var choice = completion.choices().get(0);
            var message = choice.message();

            long latencyMs = System.currentTimeMillis() - startTime;

            // Check for tool calls
            List<ToolCall> toolCalls = new ArrayList<>();
            if (message.toolCalls().isPresent()) {
                for (var tc : message.toolCalls().get()) {
                    toolCalls.add(ToolCall.builder()
                            .id(tc.id())
                            .name(tc.function().name())
                            .arguments(tc.function().arguments())
                            .build());
                }
            }

            int totalTokens = completion.usage()
                    .map(u -> (int) u.totalTokens())
                    .orElse(0);

            return LlmResponse.builder()
                    .content(message.content().orElse(""))
                    .toolCalls(toolCalls)
                    .tokensUsed(totalTokens)
                    .latencyMs((int) latencyMs)
                    .model(model != null ? model : aiConfig.getDefaultModel())
                    .finishReason(choice.finishReason().toString())
                    .build();

        } catch (Exception e) {
            log.error("OpenAI API call failed", e);
            long latencyMs = System.currentTimeMillis() - startTime;
            return LlmResponse.builder()
                    .content("I apologize, but I'm unable to process your request at the moment. Error: " + e.getMessage())
                    .tokensUsed(0)
                    .latencyMs((int) latencyMs)
                    .model(model)
                    .error(e.getMessage())
                    .build();
        }
    }

    public LlmResponse chatWithHistory(String systemPrompt, List<ChatMessage> history,
                                        String model, double temperature) {
        if (!aiConfig.isAiEnabled()) {
            return LlmResponse.builder()
                    .content("AI features are currently disabled.")
                    .tokensUsed(0).model(model).build();
        }

        long startTime = System.currentTimeMillis();
        try {
            var messages = new ArrayList<ChatCompletionMessageParam>();
            messages.add(ChatCompletionMessageParam.ofSystem(
                    ChatCompletionSystemMessageParam.builder()
                            .content(systemPrompt)
                            .build()));

            for (ChatMessage msg : history) {
                switch (msg.getRole()) {
                    case "user" -> messages.add(ChatCompletionMessageParam.ofUser(
                            ChatCompletionUserMessageParam.builder()
                                    .content(msg.getContent())
                                    .build()));
                    case "assistant" -> messages.add(ChatCompletionMessageParam.ofAssistant(
                            ChatCompletionAssistantMessageParam.builder()
                                    .content(msg.getContent())
                                    .build()));
                }
            }

            String resolvedModel = model != null ? model : aiConfig.getDefaultModel();
            var paramsBuilder = ChatCompletionCreateParams.builder()
                    .model(ChatModel.of(resolvedModel))
                    .messages(messages);
            if (!resolvedModel.contains("gpt-5")) {
                paramsBuilder.temperature(temperature);
            }
            var params = paramsBuilder.build();

            var completion = openAIClient.chat().completions().create(params);
            var choice = completion.choices().get(0);
            long latencyMs = System.currentTimeMillis() - startTime;
            int totalTokens = completion.usage().map(u -> (int) u.totalTokens()).orElse(0);

            return LlmResponse.builder()
                    .content(choice.message().content().orElse(""))
                    .tokensUsed(totalTokens)
                    .latencyMs((int) latencyMs)
                    .model(model != null ? model : aiConfig.getDefaultModel())
                    .build();

        } catch (Exception e) {
            log.error("OpenAI API call with history failed", e);
            return LlmResponse.builder()
                    .content("I apologize, but I encountered an error: " + e.getMessage())
                    .tokensUsed(0).latencyMs((int) (System.currentTimeMillis() - startTime))
                    .model(model).error(e.getMessage()).build();
        }
    }

    private ChatCompletionTool toOpenAiTool(ToolDefinition tool) {
        return ChatCompletionTool.builder()
                .function(FunctionDefinition.builder()
                        .name(tool.getName())
                        .description(tool.getDescription())
                        .parameters(FunctionParameters.builder()
                                .putAdditionalProperty("type", com.openai.core.JsonValue.from("object"))
                                .putAdditionalProperty("properties", com.openai.core.JsonValue.from(tool.getParameters()))
                                .build())
                        .build())
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class LlmResponse {
        private String content;
        private List<ToolCall> toolCalls;
        private int tokensUsed;
        private int latencyMs;
        private String model;
        private String finishReason;
        private String error;
    }

    @lombok.Data
    @lombok.Builder
    public static class ToolCall {
        private String id;
        private String name;
        private String arguments;
    }

    @lombok.Data
    @lombok.Builder
    public static class ChatMessage {
        private String role;
        private String content;
    }

    @lombok.Data
    @lombok.Builder
    public static class ToolDefinition {
        private String name;
        private String description;
        private Map<String, Object> parameters;
    }
}
