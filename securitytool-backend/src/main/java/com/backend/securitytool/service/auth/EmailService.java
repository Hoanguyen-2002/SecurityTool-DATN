package com.backend.securitytool.service.auth;

public interface EmailService {
    void sendVerificationEmail(String to, String token);
    void sendResetPasswordEmail(String to, String token);
}
