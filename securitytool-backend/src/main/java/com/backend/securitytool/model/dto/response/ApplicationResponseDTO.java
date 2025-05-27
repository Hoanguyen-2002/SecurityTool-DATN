package com.backend.securitytool.model.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class ApplicationResponseDTO {
    private Integer id;
    private String appName;
    private String appUrl;
    private String basePath;
    private String authInfo;
    private String scanStatus;
    private Instant createdAt;
    private Instant updatedAt;
    private String description;
    private String techStack;
}
