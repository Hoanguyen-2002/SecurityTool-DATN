package com.backend.securitytool.controller;

import com.backend.securitytool.model.dto.request.ChatRequestDTO;
import com.backend.securitytool.service.chat.ChatService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
public class ChatController {
    private final ChatService chatService;

    @Autowired
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chatWithAI(@RequestBody ChatRequestDTO requestDTO) {
        String response = chatService.chatWithAI(requestDTO);
        return ResponseEntity.ok(response);

    }

    @PostMapping("/chat-with-file")
    public ResponseEntity<String> chatWithFile(@RequestParam("file") MultipartFile multipartFile, @RequestParam("message") String message) {
        String response = chatService.chatWithFile(multipartFile, message);
        return ResponseEntity.ok(response);
    }
}
