package com.backend.securitytool.service.auth;

import com.backend.securitytool.model.dto.request.LoginRequestDTO;
import com.backend.securitytool.model.dto.request.RegisterRequestDTO;
import com.backend.securitytool.model.dto.request.EditUserInfoRequestDTO;
import com.backend.securitytool.model.dto.request.ChangePasswordRequestDTO;
import com.backend.securitytool.model.dto.response.JwtResponseDTO;
import com.backend.securitytool.model.entity.User;
import com.backend.securitytool.repository.UserRepository;
import com.backend.securitytool.security.JwtUtil;
import com.backend.securitytool.service.email.EmailService;
import jakarta.servlet.http.HttpServletRequest;
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
    public void register(RegisterRequestDTO dto, HttpServletRequest request) {
        // Validate username uniqueness
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        // Check if email is already used by any account
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        // Validate phone is numeric if provided
        if (dto.getPhone() != null && !dto.getPhone().isEmpty() && !dto.getPhone().matches("\\d+")) {
            throw new RuntimeException("Phone number must be numeric");
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
        emailService.sendVerificationEmail(dto.getEmail(), verificationToken, request);
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
        String accessToken = jwtUtil.generateAccessToken(user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());
        return new JwtResponseDTO(
                accessToken,
                refreshToken,
                user.getUsername(),
                user.getEmail(),
                user.isMustChangePassword()
        );
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
            // Check if email is used by another account (not current user)
            if (userRepository.findByEmailAndUsernameNot(dto.getEmail(), currentUsername).isPresent()) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(dto.getEmail());
        }
        if (dto.getPhone() != null) {
            if (!dto.getPhone().matches("\\d+")) {
                throw new RuntimeException("Phone number must be numeric");
            }
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

    @Override
    public JwtUtil getJwtUtil() {
        return jwtUtil;
    }

    @Override
    // Thêm phương thức này để làm mới access token từ refresh token
    public JwtResponseDTO refreshAccessToken(String refreshToken) {
        if (!jwtUtil.validateRefreshToken(refreshToken)) {
            throw new RuntimeException("Invalid or expired refresh token");
        }
        String username = jwtUtil.getUsernameFromJwt(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String newAccessToken = jwtUtil.generateAccessToken(username);
        return new JwtResponseDTO(
                newAccessToken,
                refreshToken,
                user.getUsername(),
                user.getEmail(),
                user.isMustChangePassword()
        );
    }
}
