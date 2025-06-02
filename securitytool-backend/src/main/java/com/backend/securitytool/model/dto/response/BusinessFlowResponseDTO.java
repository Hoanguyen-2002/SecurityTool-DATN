package com.backend.securitytool.model.dto.response;

import com.backend.securitytool.model.dto.request.ApiEndpointParamDTO;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class BusinessFlowResponseDTO {
    private Integer id;
    private String flowName;
    private Integer resultId;
    private List<ApiEndpointParamDTO> apiEndpoints; // Now includes httpMethod in ApiEndpointParamDTO
    private String flowDescription;
    private Integer appId;
}
