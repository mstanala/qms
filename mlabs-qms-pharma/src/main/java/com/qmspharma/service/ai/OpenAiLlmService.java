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

    /**
     * Chat with tool calling loop: sends tools to LLM, executes tool calls via executor,
     * returns tool results to LLM, and returns the final response.
     */
    public LlmResponse chatWithTools(String systemPrompt, String userMessage, String model,
                                      List<ToolDefinition> tools, double temperature,
                                      java.util.function.Function<ToolCall, String> toolExecutor) {
        if (!aiConfig.isAiEnabled()) {
            return LlmResponse.builder()
                    .content("AI features are currently disabled.")
                    .tokensUsed(0).model(model).build();
        }

        long startTime = System.currentTimeMillis();
        int totalTokens = 0;

        try {
            var messages = new ArrayList<ChatCompletionMessageParam>();
            messages.add(ChatCompletionMessageParam.ofSystem(
                    ChatCompletionSystemMessageParam.builder().content(systemPrompt).build()));
            messages.add(ChatCompletionMessageParam.ofUser(
                    ChatCompletionUserMessageParam.builder().content(userMessage).build()));

            String resolvedModel = model != null ? model : aiConfig.getDefaultModel();
            var chatTools = tools.stream().map(this::toOpenAiTool).toList();

            // Tool call loop (max 5 rounds to prevent infinite loops)
            for (int round = 0; round < 5; round++) {
                var requestBuilder = ChatCompletionCreateParams.builder()
                        .model(ChatModel.of(resolvedModel))
                        .messages(messages)
                        .tools(chatTools);
                if (!resolvedModel.contains("gpt-5")) {
                    requestBuilder.temperature(temperature);
                }

                var completion = openAIClient.chat().completions().create(requestBuilder.build());
                var choice = completion.choices().get(0);
                var assistantMsg = choice.message();
                totalTokens += completion.usage().map(u -> (int) u.totalTokens()).orElse(0);

                // If no tool calls, return the final text response
                if (assistantMsg.toolCalls().isEmpty() || assistantMsg.toolCalls().get().isEmpty()) {
                    return LlmResponse.builder()
                            .content(assistantMsg.content().orElse(""))
                            .tokensUsed(totalTokens)
                            .latencyMs((int) (System.currentTimeMillis() - startTime))
                            .model(resolvedModel)
                            .finishReason(choice.finishReason().toString())
                            .build();
                }

                // Add assistant message with tool calls to conversation
                messages.add(ChatCompletionMessageParam.ofAssistant(
                        ChatCompletionAssistantMessageParam.builder()
                                .content(assistantMsg.content().orElse(""))
                                .toolCalls(assistantMsg.toolCalls().get())
                                .build()));

                // Execute each tool call and add results
                for (var tc : assistantMsg.toolCalls().get()) {
                    ToolCall toolCall = ToolCall.builder()
                            .id(tc.id())
                            .name(tc.function().name())
                            .arguments(tc.function().arguments())
                            .build();

                    String toolResult = toolExecutor.apply(toolCall);
                    log.debug("Tool {} returned {} chars", toolCall.getName(), toolResult.length());

                    messages.add(ChatCompletionMessageParam.ofTool(
                            ChatCompletionToolMessageParam.builder()
                                    .toolCallId(tc.id())
                                    .content(toolResult)
                                    .build()));
                }
            }

            // Fallback if loop exhausted
            return LlmResponse.builder()
                    .content("I retrieved the data but ran into complexity limits. Please try a more specific query.")
                    .tokensUsed(totalTokens)
                    .latencyMs((int) (System.currentTimeMillis() - startTime))
                    .model(resolvedModel)
                    .build();

        } catch (Exception e) {
            log.error("OpenAI tool-calling chat failed", e);
            return LlmResponse.builder()
                    .content("I encountered an error while querying the QMS database: " + e.getMessage())
                    .tokensUsed(totalTokens)
                    .latencyMs((int) (System.currentTimeMillis() - startTime))
                    .model(model).error(e.getMessage()).build();
        }
    }

    /**
     * Streaming version of chatWithTools: runs tool-calling rounds synchronously,
     * then streams the final LLM response token-by-token via the provided callback.
     * Returns metadata (tokens, model) after streaming completes.
     */
    public LlmResponse chatWithToolsStreaming(String systemPrompt, String userMessage, String model,
                                               List<ToolDefinition> tools, double temperature,
                                               java.util.function.Function<ToolCall, String> toolExecutor,
                                               java.util.function.Consumer<String> tokenConsumer) {
        if (!aiConfig.isAiEnabled()) {
            String msg = "AI features are currently disabled.";
            tokenConsumer.accept(msg);
            return LlmResponse.builder().content(msg).tokensUsed(0).model(model).build();
        }

        long startTime = System.currentTimeMillis();
        int totalTokens = 0;

        try {
            var messages = new ArrayList<ChatCompletionMessageParam>();
            messages.add(ChatCompletionMessageParam.ofSystem(
                    ChatCompletionSystemMessageParam.builder().content(systemPrompt).build()));
            messages.add(ChatCompletionMessageParam.ofUser(
                    ChatCompletionUserMessageParam.builder().content(userMessage).build()));

            String resolvedModel = model != null ? model : aiConfig.getDefaultModel();
            var chatTools = tools.stream().map(this::toOpenAiTool).toList();

            // Phase 1: Tool-calling rounds (non-streaming) — up to 5 rounds
            for (int round = 0; round < 5; round++) {
                var requestBuilder = ChatCompletionCreateParams.builder()
                        .model(ChatModel.of(resolvedModel))
                        .messages(messages)
                        .tools(chatTools);
                if (!resolvedModel.contains("gpt-5")) {
                    requestBuilder.temperature(temperature);
                }

                var completion = openAIClient.chat().completions().create(requestBuilder.build());
                var choice = completion.choices().get(0);
                var assistantMsg = choice.message();
                totalTokens += completion.usage().map(u -> (int) u.totalTokens()).orElse(0);

                // If no tool calls, we've gathered all data — break to Phase 2
                if (assistantMsg.toolCalls().isEmpty() || assistantMsg.toolCalls().get().isEmpty()) {
                    // No tool calls — stream the already-received content as a single chunk,
                    // then break to Phase 2 for a proper streaming re-request if content is empty.
                    String content = assistantMsg.content().orElse("");
                    if (!content.isEmpty()) {
                        tokenConsumer.accept(content);
                    }
                    return LlmResponse.builder()
                            .content(content)
                            .tokensUsed(totalTokens)
                            .latencyMs((int) (System.currentTimeMillis() - startTime))
                            .model(resolvedModel)
                            .finishReason(choice.finishReason().toString())
                            .build();
                }

                // Add assistant message with tool calls
                messages.add(ChatCompletionMessageParam.ofAssistant(
                        ChatCompletionAssistantMessageParam.builder()
                                .content(assistantMsg.content().orElse(""))
                                .toolCalls(assistantMsg.toolCalls().get())
                                .build()));

                // Execute tool calls
                for (var tc : assistantMsg.toolCalls().get()) {
                    ToolCall toolCall = ToolCall.builder()
                            .id(tc.id())
                            .name(tc.function().name())
                            .arguments(tc.function().arguments())
                            .build();
                    String toolResult = toolExecutor.apply(toolCall);
                    log.debug("Tool {} returned {} chars", toolCall.getName(), toolResult.length());
                    messages.add(ChatCompletionMessageParam.ofTool(
                            ChatCompletionToolMessageParam.builder()
                                    .toolCallId(tc.id())
                                    .content(toolResult)
                                    .build()));
                }
            }

            // Phase 2: Stream the final response (after tool data gathered)
            var streamRequestBuilder = ChatCompletionCreateParams.builder()
                    .model(ChatModel.of(resolvedModel))
                    .messages(messages);
            if (!resolvedModel.contains("gpt-5")) {
                streamRequestBuilder.temperature(temperature);
            }

            var stream = openAIClient.chat().completions().createStreaming(streamRequestBuilder.build());
            var contentBuilder = new StringBuilder();

            stream.stream().forEach(chunk -> {
                if (!chunk.choices().isEmpty()) {
                    var delta = chunk.choices().get(0).delta();
                    delta.content().ifPresent(token -> {
                        contentBuilder.append(token);
                        tokenConsumer.accept(token);
                    });
                }
            });
            stream.close();

            return LlmResponse.builder()
                    .content(contentBuilder.toString())
                    .tokensUsed(totalTokens)
                    .latencyMs((int) (System.currentTimeMillis() - startTime))
                    .model(resolvedModel)
                    .finishReason("stop")
                    .build();

        } catch (Exception e) {
            log.error("Streaming chat with tools failed", e);
            String errMsg = "I encountered an error: " + e.getMessage();
            tokenConsumer.accept(errMsg);
            return LlmResponse.builder()
                    .content(errMsg)
                    .tokensUsed(totalTokens)
                    .latencyMs((int) (System.currentTimeMillis() - startTime))
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
