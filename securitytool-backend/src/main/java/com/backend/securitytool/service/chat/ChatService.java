package com.backend.securitytool.service.chat;

import com.backend.securitytool.model.dto.request.ChatRequestDTO;
import org.springframework.stereotype.Service;

@Service
public interface ChatService {
    public String chatWithAI(ChatRequestDTO message);
}

