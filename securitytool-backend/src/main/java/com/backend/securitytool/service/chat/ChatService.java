package com.backend.securitytool.service.chat;

import com.backend.securitytool.model.dto.request.ChatRequestDTO;
import org.springframework.web.multipart.MultipartFile;


public interface ChatService {
    String chatWithAI(ChatRequestDTO message);
    String chatWithFile(MultipartFile file, String message);
}

