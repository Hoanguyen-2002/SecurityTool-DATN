package com.backend.securitytool.service.chat;

import com.backend.securitytool.model.dto.request.ChatRequestDTO;


public interface ChatService {
    String chatWithAI(ChatRequestDTO message);
}

