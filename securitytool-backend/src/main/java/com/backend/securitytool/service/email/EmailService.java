package com.backend.securitytool.service.email;

public interface EmailService {
    void sendVerificationEmail(String to, String token);
    void sendResetPasswordEmail(String to, String tempPassword);
}
