package com.backend.securitytool.mapper;

import com.backend.securitytool.model.dto.request.BusinessFlowRequestDTO;
import com.backend.securitytool.model.dto.request.ApiEndpointParamDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;
import com.backend.securitytool.model.entity.BusinessFlow;
import com.backend.securitytool.model.entity.ScanResult;
import com.backend.securitytool.model.entity.TargetApplication;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring")
public abstract class BusinessFlowMapper {

    @Autowired
    protected ObjectMapper objectMapper;

    @Mapping(target = "resultId", source = "result.id")
    @Mapping(target = "apiEndpoints", source = "apiEndpoints", qualifiedByName = "jsonToApiEndpointParamList")
    @Mapping(target = "appId", source = "app.id")
    public abstract BusinessFlowResponseDTO toResponseDTO(BusinessFlow entity);

    @Mapping(target = "result", source = "resultId", qualifiedByName = "resultIdToScanResult")
    @Mapping(target = "apiEndpoints", source = "apiEndpoints", qualifiedByName = "apiEndpointParamListToJson")
    @Mapping(target = "app", source = "appId", qualifiedByName = "appIdToTargetApplication")
    public abstract BusinessFlow toEntity(BusinessFlowRequestDTO dto);

    @Named("jsonToApiEndpointParamList")
    protected List<ApiEndpointParamDTO> jsonToApiEndpointParamList(String json) {
        if (json == null) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, objectMapper.getTypeFactory().constructCollectionType(List.class, ApiEndpointParamDTO.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    @Named("apiEndpointParamListToJson")
    protected String apiEndpointParamListToJson(List<ApiEndpointParamDTO> list) {
        if (list == null) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    @Named("resultIdToScanResult")
    protected ScanResult resultIdToScanResult(Integer resultId) {
        if (resultId == null) return null;
        ScanResult result = new ScanResult();
        result.setId(resultId);
        return result;
    }

    @Named("appIdToTargetApplication")
    protected TargetApplication appIdToTargetApplication(Integer appId) {
        if (appId == null) return null;
        TargetApplication app = new TargetApplication();
        app.setId(appId);
        return app;
    }
}
