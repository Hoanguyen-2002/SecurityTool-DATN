package com.backend.securitytool.service.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void sendVerificationEmail(String to, String token) {
        String subject = "Account Verification";
        String verificationLink = frontendUrl + "/verify?token=" + token;
        String text = "Thank you for registering!\n\n"
                + "Please click the link below to verify your account:\n"
                + verificationLink + "\n\n"
                + "If you did not register, please ignore this email.";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
    }

    @Override
    public void sendResetPasswordEmail(String to, String token) {
        String subject = "Reset Password";
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String text = "You requested to reset your password.\n\n"
                + "Please click the link below to reset your password:\n"
                + resetLink + "\n\n"
                + "If you did not request this, please ignore this email.";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
    }
}
