package com.backend.securitytool.controller;

import com.backend.securitytool.model.dto.request.LoginRequestDTO;
import com.backend.securitytool.model.dto.request.RegisterRequestDTO;
import com.backend.securitytool.model.dto.request.EditUserInfoRequestDTO;
import com.backend.securitytool.model.dto.request.ChangePasswordRequestDTO;
import com.backend.securitytool.model.dto.response.JwtResponseDTO;
import com.backend.securitytool.model.entity.User;
import com.backend.securitytool.repository.UserRepository;
import com.backend.securitytool.service.auth.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequestDTO dto) {
        authService.register(dto);
        return ResponseEntity.ok("Register successful. Please check your email to verify your account.");
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponseDTO> login(@RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @GetMapping("/verify")
    public ResponseEntity<String> verify(@RequestParam String token) {
        boolean result = authService.verifyAccount(token);
        if (result) {
            return ResponseEntity.ok("Account verified successfully.");
        }
        return ResponseEntity.badRequest().body("Invalid verification token.");
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        authService.logout(token);
        return ResponseEntity.ok("Logged out successfully.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }
        authService.resetPassword(email);
        return ResponseEntity.ok("If your email exists, a reset password link has been sent.");
    }

    @PutMapping("/edit-info")
    public ResponseEntity<String> editUserInfo(
            @RequestBody EditUserInfoRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            authService.editUserInfo(userDetails.getUsername(), dto);
            return ResponseEntity.ok("User information updated successfully.");
        } catch (RuntimeException ex) {
            if (ex.getMessage() != null && ex.getMessage().contains("Username changed")) {
                return ResponseEntity.status(440).body("Username changed. Please login again with your new username.");
            }
            throw ex;
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestBody ChangePasswordRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("You must be authenticated to change your password.");
        }
        String username = userDetails.getUsername();
        try {
            authService.changePassword(username, dto);
            return ResponseEntity.ok("Password changed successfully.");
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("email", user.getEmail());
        result.put("phone", user.getPhone());
        result.put("major", user.getMajor());
        result.put("companyName", user.getCompanyName());
        result.put("createdAt", user.getCreatedAt());
        result.put("updatedAt", user.getUpdatedAt());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.badRequest().body("Refresh token is required.");
        }
        try {
            if (!authService.getJwtUtil().validateRefreshToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired refresh token.");
            }
            String username = authService.getJwtUtil().getUsernameFromJwt(refreshToken);
            String newAccessToken = authService.getJwtUtil().generateAccessToken(username);
            Map<String, String> result = new HashMap<>();
            result.put("accessToken", newAccessToken);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired refresh token.");
        }
    }
}
