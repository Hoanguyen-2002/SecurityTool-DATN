package com.backend.securitytool.service.email;

import jakarta.servlet.http.HttpServletRequest;

public interface EmailService {
    void sendVerificationEmail(String to, String token, HttpServletRequest request);
    void sendResetPasswordEmail(String to, String tempPassword);
}
