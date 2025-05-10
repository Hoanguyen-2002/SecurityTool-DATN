package com.backend.securitytool.model.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ApiEndpointRequestDTO {
    private Integer appId;
    private Integer businessFlowId;
    private String path;
    private String method;
    private String params;
    private String responseFormat;
}
