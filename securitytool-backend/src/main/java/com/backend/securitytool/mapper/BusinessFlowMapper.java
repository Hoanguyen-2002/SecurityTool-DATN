package com.backend.securitytool.mapper;

import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;
import com.backend.securitytool.model.entity.BusinessFlow;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.stereotype.Component;


@Mapper(componentModel = "spring")
public interface BusinessFlowMapper {

    @Mapping(source = "app.id", target = "appId")
    @Mapping(source = "stepsJson", target = "stepsJson")
    BusinessFlowResponseDTO toResponseDTO(BusinessFlow entity);
}
