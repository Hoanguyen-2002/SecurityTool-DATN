package com.backend.securitytool.controller;

import com.backend.securitytool.model.dto.request.ChatRequestDTO;
import com.backend.securitytool.service.chat.ChatServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class ChatController {
    private final ChatServiceImpl chatServiceImpl;

    @Autowired
    public ChatController(ChatServiceImpl chatServiceImpl) {
        this.chatServiceImpl = chatServiceImpl;
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chatWithAI(@RequestBody ChatRequestDTO requestDTO) {
        String response = chatServiceImpl.chatWithAI(requestDTO);
        return ResponseEntity.ok(response);

    }
}
