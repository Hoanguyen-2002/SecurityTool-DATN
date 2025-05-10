package com.backend.securitytool.service.appmanagement.apiendpoint;

import com.backend.securitytool.constants.ErrorMessages;
import com.backend.securitytool.exception.ResourceNotFoundException;
import com.backend.securitytool.mapper.ApiEndpointMapper;
import com.backend.securitytool.model.dto.request.ApiEndpointRequestDTO;
import com.backend.securitytool.model.dto.response.ApiEndpointResponseDTO;
import com.backend.securitytool.model.entity.ApiEndpoint;
import com.backend.securitytool.model.entity.TargetApplication;
import com.backend.securitytool.repository.ApiEndpointRepository;
import com.backend.securitytool.repository.TargetApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiEndpointServiceImpl implements ApiEndpointService {

    private static final Logger logger = LoggerFactory.getLogger(ApiEndpointServiceImpl.class);


    private ApiEndpointRepository apiEndpointRepository;
    private TargetApplicationRepository targetApplicationRepository;
    private ApiEndpointMapper apiEndpointMapper;

    @Autowired
    public ApiEndpointServiceImpl(ApiEndpointRepository apiEndpointRepository, TargetApplicationRepository targetApplicationRepository, ApiEndpointMapper apiEndpointMapper) {
        this.apiEndpointRepository = apiEndpointRepository;
        this.targetApplicationRepository = targetApplicationRepository;
        this.apiEndpointMapper = apiEndpointMapper;
    }

    public List<ApiEndpointResponseDTO> getApiEndpoints(Integer appId) {
        logger.debug("Fetching API endpoints for appId: {}", appId);
        targetApplicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + appId));
        List<ApiEndpoint> endpoints = apiEndpointRepository.findByAppId(appId);
        return endpoints.stream()
                .map(apiEndpointMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    public ApiEndpointResponseDTO addApiEndpoint(Integer appId, ApiEndpointRequestDTO dto) {
        logger.debug("Adding API endpoint for appId: {}", appId);
        TargetApplication app = targetApplicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + appId));

        ApiEndpoint endpoint = apiEndpointMapper.toEntity(dto);
        endpoint.setApp(app);
        ApiEndpoint savedEndpoint = apiEndpointRepository.save(endpoint);
        return apiEndpointMapper.toResponseDTO(savedEndpoint);
    }
}
