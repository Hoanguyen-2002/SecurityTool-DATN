package com.backend.securitytool.service.auth;

import com.backend.securitytool.model.dto.request.LoginRequestDTO;
import com.backend.securitytool.model.dto.request.RegisterRequestDTO;
import com.backend.securitytool.model.dto.request.EditUserInfoRequestDTO;
import com.backend.securitytool.model.dto.request.ChangePasswordRequestDTO;
import com.backend.securitytool.model.dto.response.JwtResponseDTO;
import com.backend.securitytool.model.entity.User;
import com.backend.securitytool.repository.UserRepository;
import com.backend.securitytool.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Override
    public void register(RegisterRequestDTO dto) {
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        String encodedPassword = passwordEncoder.encode(dto.getPassword());
        String verificationToken = UUID.randomUUID().toString();
        User user = User.builder()
                .username(dto.getUsername())
                .password(encodedPassword)
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .major(dto.getMajor())
                .companyName(dto.getCompanyName())
                .enabled(true) // Set enabled to true immediately after registration
                .verificationToken(verificationToken)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        userRepository.save(user);
        emailService.sendVerificationEmail(dto.getEmail(), verificationToken);
    }

    @Override
    public JwtResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByUsername(dto.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!user.isEnabled()) {
            throw new RuntimeException("Account not verified. Please check your email.");
        }
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        String token = jwtUtil.generateToken(user.getUsername());
        // Always return JWT and mustChangePassword flag
        return new JwtResponseDTO(token, user.getUsername(), user.getEmail(), user.getMajor(), user.isMustChangePassword());
    }

    @Override
    public boolean verifyAccount(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));
        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        return true;
    }

    @Override
    public void logout(String token) {
        // Nếu dùng JWT stateless, chỉ cần client xóa token.
        // Nếu muốn blacklist token, cần lưu token vào DB/cache (chưa triển khai ở đây).
        // Để đơn giản, không làm gì cả.
    }

    @Override
    @Transactional
    public void resetPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Email not found");
        }
        User user = userOpt.get();
        // Generate a random temporary password
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        String encodedTempPassword = passwordEncoder.encode(tempPassword);
        user.setPassword(encodedTempPassword);
        user.setMustChangePassword(true); // User must change password after login
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        emailService.sendResetPasswordEmail(email, tempPassword);
    }

    @Override
    public void editUserInfo(String currentUsername, EditUserInfoRequestDTO dto) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(dto.getEmail());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getMajor() != null) {
            user.setMajor(dto.getMajor());
        }
        if (dto.getCompanyName() != null) {
            user.setCompanyName(dto.getCompanyName());
        }
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    @Override
    public void changePassword(String username, ChangePasswordRequestDTO dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect.");
        }
        if (dto.getNewPassword() == null || dto.getNewPassword().isEmpty()) {
            throw new RuntimeException("New password must not be empty.");
        }
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        user.setMustChangePassword(false); // Đã đổi mật khẩu, không cần bắt buộc đổi nữa
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }
}
