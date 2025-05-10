package com.backend.securitytool.model.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ScanRequestDTO {
    private Integer appId;
    /**
     * The project key used to identify a project in SonarQube.
     * This is required when running a static code analysis scan with SonarQube.
     */
    private String projectKey;

    /**
     * The URL of the target application to be scanned by ZAP (Zed Attack Proxy).
     * This is required when running a dynamic security scan with ZAP.
     */
    private String targetUrl;
}
