package com.backend.securitytool.service.auth;

import com.backend.securitytool.model.dto.request.LoginRequestDTO;
import com.backend.securitytool.model.dto.request.RegisterRequestDTO;
import com.backend.securitytool.model.dto.request.EditUserInfoRequestDTO;
import com.backend.securitytool.model.dto.request.ChangePasswordRequestDTO;
import com.backend.securitytool.model.dto.response.JwtResponseDTO;
import com.backend.securitytool.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    void register(RegisterRequestDTO dto, HttpServletRequest request);
    JwtResponseDTO login(LoginRequestDTO dto);
    boolean verifyAccount(String token);
    void logout(String token);
    void resetPassword(String email);
    void editUserInfo(String currentUsername, EditUserInfoRequestDTO dto);
    void changePassword(String username, ChangePasswordRequestDTO dto);
    JwtUtil getJwtUtil();
    JwtResponseDTO refreshAccessToken(String refreshToken);
}
