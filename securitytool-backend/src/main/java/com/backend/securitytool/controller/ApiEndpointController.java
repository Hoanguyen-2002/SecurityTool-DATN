package com.backend.securitytool.controller;

import com.backend.securitytool.constants.ApiConstants;
import com.backend.securitytool.model.dto.request.ApiEndpointRequestDTO;
import com.backend.securitytool.model.dto.response.ApiEndpointResponseDTO;
import com.backend.securitytool.model.dto.response.CommonResponse;
import com.backend.securitytool.service.appmanagement.apiendpoint.ApiEndpointService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.APPS_BASE_URL + "/{appId}" + "/endpoints")
public class ApiEndpointController {

    @Autowired
    private ApiEndpointService apiEndpointService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<ApiEndpointResponseDTO>>> getApiEndpoints(@PathVariable Integer appId) {
        List<ApiEndpointResponseDTO> endpoints = apiEndpointService.getApiEndpoints(appId);
        CommonResponse<List<ApiEndpointResponseDTO>> response = new CommonResponse<>(
                "success",
                "API Endpoints retrieved successfully",
                endpoints,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<CommonResponse<ApiEndpointResponseDTO>> addApiEndpoint(@PathVariable Integer appId, @RequestBody ApiEndpointRequestDTO endpointDTO) {
        ApiEndpointResponseDTO endpoint = apiEndpointService.addApiEndpoint(appId, endpointDTO);
        CommonResponse<ApiEndpointResponseDTO> response = new CommonResponse<>(
                "success",
                "API Endpoint added successfully",
                endpoint,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}