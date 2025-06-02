package com.backend.securitytool.model.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class BusinessFlowRequestDTO {
    private String flowName;
    private Integer resultId;
    private List<ApiEndpointParamDTO> apiEndpoints; // Now includes httpMethod in ApiEndpointParamDTO
    private String flowDescription;
    private Integer appId;
}
