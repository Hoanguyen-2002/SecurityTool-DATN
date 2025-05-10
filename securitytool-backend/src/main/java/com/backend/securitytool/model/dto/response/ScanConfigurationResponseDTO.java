package com.backend.securitytool.model.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ScanConfigurationResponseDTO {
    private Integer id;
    private Integer appId;
    private String sonarqubeConfig;
    private String zapConfig;
    private String customRules;
}
