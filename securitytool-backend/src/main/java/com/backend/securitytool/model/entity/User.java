package com.backend.securitytool.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "users", schema = "security_tool")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 50)
    private String major; // software engineer, security analyst, devops engineer, Ai Engineer, ...

    @Column(nullable = false)
    private boolean enabled = false; // for email verification

    @Column
    private String verificationToken;

    @Column
    private Instant createdAt;

    @Column
    private Instant updatedAt;
}
