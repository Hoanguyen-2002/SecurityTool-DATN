package com.backend.securitytool.model.dto.request;

import lombok.Data;

@Data
public class EditUserInfoRequestDTO {
    private String username;
    private String email;
    private String phone;
    private String major;
}
