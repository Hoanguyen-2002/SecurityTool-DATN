package com.backend.securitytool.service.auth;

import com.backend.securitytool.model.dto.request.LoginRequestDTO;
import com.backend.securitytool.model.dto.request.RegisterRequestDTO;
import com.backend.securitytool.model.dto.request.EditUserInfoRequestDTO;
import com.backend.securitytool.model.dto.request.ChangePasswordRequestDTO;
import com.backend.securitytool.model.dto.response.JwtResponseDTO;
import com.backend.securitytool.security.JwtUtil;

public interface AuthService {
    void register(RegisterRequestDTO dto);
    JwtResponseDTO login(LoginRequestDTO dto);
    boolean verifyAccount(String token);
    void logout(String token);
    void resetPassword(String email);
    void editUserInfo(String currentUsername, EditUserInfoRequestDTO dto);
    void changePassword(String username, ChangePasswordRequestDTO dto);

    // Thêm getter cho JwtUtil để controller sử dụng
    JwtUtil getJwtUtil();
}
