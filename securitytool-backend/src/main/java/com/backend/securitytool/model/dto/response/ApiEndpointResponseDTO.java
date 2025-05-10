package com.backend.securitytool.model.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ApiEndpointResponseDTO {
    private Integer id;
    private Integer appId;
    private Integer businessFlowId;
    private String path;
    private String method;
    private String params;
    private String responseFormat;
}
