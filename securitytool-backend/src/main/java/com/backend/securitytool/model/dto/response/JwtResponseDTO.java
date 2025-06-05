package com.backend.securitytool.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponseDTO {
    private String accessToken;
    private String refreshToken;
    private String username;
    private String email;
    private String major;
    private boolean mustChangePassword;
}
