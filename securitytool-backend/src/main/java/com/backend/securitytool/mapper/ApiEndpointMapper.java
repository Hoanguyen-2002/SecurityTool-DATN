package com.backend.securitytool.mapper;

import com.backend.securitytool.model.dto.request.ApiEndpointRequestDTO;
import com.backend.securitytool.model.dto.response.ApiEndpointResponseDTO;
import com.backend.securitytool.model.entity.ApiEndpoint;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.stereotype.Component;


@Mapper(componentModel = "spring")
public interface ApiEndpointMapper {

    @Mapping(source = "app.id", target = "appId")
    @Mapping(source = "businessFlow.id", target = "businessFlowId")
    @Mapping(source = "params", target = "params")
    @Mapping(source = "responseFormat", target = "responseFormat")
    ApiEndpointResponseDTO toResponseDTO(ApiEndpoint entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "app", ignore = true)
    @Mapping(target = "businessFlow", ignore = true)
    ApiEndpoint toEntity(ApiEndpointRequestDTO dto);
}
