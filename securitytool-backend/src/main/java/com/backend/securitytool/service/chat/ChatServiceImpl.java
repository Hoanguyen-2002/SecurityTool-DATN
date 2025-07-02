package com.backend.securitytool.service.chat;

import com.backend.securitytool.model.dto.request.ChatRequestDTO;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

@Service
public class ChatServiceImpl implements ChatService{

    private final ChatClient chatClient;

    public ChatServiceImpl(ChatClient.Builder builder) {
        chatClient = builder.build();
    }

    @Override
    public String chatWithAI(ChatRequestDTO requestDTO) {
        SystemMessage systemMessage = new SystemMessage("""
                You are Security-Tool Assistant for suupporting user on recognizing security
                You should response in informal way
                """);

        UserMessage userMessage = new UserMessage(requestDTO.message());

        Prompt prompt = new Prompt(userMessage, systemMessage);
        return chatClient
                .prompt(prompt)
                .call().content();
    }
}
