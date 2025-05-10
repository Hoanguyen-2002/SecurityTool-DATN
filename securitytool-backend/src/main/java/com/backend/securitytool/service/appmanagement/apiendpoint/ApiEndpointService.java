package com.backend.securitytool.service.appmanagement.apiendpoint;

import com.backend.securitytool.model.dto.request.ApiEndpointRequestDTO;
import com.backend.securitytool.model.dto.response.ApiEndpointResponseDTO;

import java.util.List;

public interface ApiEndpointService {
    List<ApiEndpointResponseDTO> getApiEndpoints(Integer appId);
    ApiEndpointResponseDTO addApiEndpoint(Integer appId, ApiEndpointRequestDTO dto);
}
