package com.backend.securitytool.service.chat;

import com.backend.securitytool.model.dto.request.ChatRequestDTO;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.content.Media;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ChatServiceImpl implements ChatService{

    private final ChatClient chatClient;

    @Autowired
    public ChatServiceImpl(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    @Override
    public String chatWithAI(ChatRequestDTO requestDTO) {
        SystemMessage systemMessage = new SystemMessage("""
                You are Security-Tool Assistant for supporting user on recognizing security
                You should response in informal way
                Only allow user to ask question about sonarqube, owasp zap, business logic of e-commerce website or anything 
                relate to e-commerce website and vulnerability issue about e-commerce website 
                """);

        UserMessage userMessage = new UserMessage(requestDTO.message());

        Prompt prompt = new Prompt(userMessage, systemMessage);
        return chatClient
                .prompt(prompt)
                .call().content();
    }

    @Override
    public String chatWithFile(MultipartFile file, String message) {
        Media media = Media.builder()
                .mimeType(MediaType.parseMediaType("text/csv"))
                .data(file.getResource())
                .build();

        return chatClient
                .prompt()
                .system("You are Security-Tool Assistant for supporting user on recognizing security" +
                        "                You should response in informal way\n" +
                        "                Only allow user to ask question about sonarqube, owasp zap, business logic of e-commerce website or anything \n" +
                        "                relate to e-commerce website and vulnerability issue about e-commerce website ")
                .user(promptUserSpec
                                -> promptUserSpec.media(media)
                                .text(message))
                                .call()
                                .content();
    }
}
