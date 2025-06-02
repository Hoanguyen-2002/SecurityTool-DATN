package com.backend.securitytool.model.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ApiEndpointParamDTO {
    private String endpoint;    // endpoint path
    private String httpMethod;  // HTTP method (GET, POST, etc.)
    private String params;      // params/validation (JSON string or object)
}
