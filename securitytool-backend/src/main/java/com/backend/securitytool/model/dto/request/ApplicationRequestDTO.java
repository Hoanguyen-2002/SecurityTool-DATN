package com.backend.securitytool.model.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ApplicationRequestDTO {
    private String appName;
    private String appUrl;
    private String basePath;
    private String authInfo;
    private String description;
    private String techStack;
}
