package com.backend.securitytool.model.dto.request;

import lombok.Data;

@Data
public class RegisterRequestDTO {
    private String username;
    private String password;
    private String email;
    private String phone;
    private String major;
}
