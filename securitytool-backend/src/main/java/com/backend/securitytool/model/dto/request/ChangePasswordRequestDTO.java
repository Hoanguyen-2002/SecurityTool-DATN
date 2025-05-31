package com.backend.securitytool.model.dto.request;

import lombok.Data;

@Data
public class ChangePasswordRequestDTO {
    private String currentPassword;
    private String newPassword;
}
