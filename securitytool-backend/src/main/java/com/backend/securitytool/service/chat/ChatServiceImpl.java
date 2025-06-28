package com.backend.securitytool.service.chat;

import com.backend.securitytool.model.dto.request.ChatRequestDTO;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class ChatServiceImpl implements ChatService{

    private final ChatClient chatClient;

    public ChatServiceImpl(ChatClient.Builder builder) {
        chatClient = builder.build();
    }

    @Override
    public String chatWithAI(ChatRequestDTO requestDTO) {
        return chatClient
                .prompt(requestDTO.message())
                .call().content();
    }
}
