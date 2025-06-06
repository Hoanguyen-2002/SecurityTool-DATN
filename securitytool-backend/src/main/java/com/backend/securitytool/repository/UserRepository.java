package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String token);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.username <> :username")
    Optional<User> findByEmailAndUsernameNot(@Param("email") String email, @Param("username") String username);
}
