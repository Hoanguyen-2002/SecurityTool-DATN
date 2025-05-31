package com.backend.securitytool.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponseDTO {
    private String token;
    private String username;
    private String email;
    private String major;
    private boolean mustChangePassword;
}
