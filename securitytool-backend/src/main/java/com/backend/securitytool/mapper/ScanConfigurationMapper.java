package com.backend.securitytool.mapper;

import com.backend.securitytool.model.dto.response.ScanConfigurationResponseDTO;
import com.backend.securitytool.model.entity.ScanConfiguration;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.stereotype.Component;


@Mapper(componentModel = "spring")
public interface ScanConfigurationMapper {

    @Mapping(source = "app.id", target = "appId")
    @Mapping(source = "sonarqubeConfig", target = "sonarqubeConfig")
    @Mapping(source = "zapConfig", target = "zapConfig")
    @Mapping(source = "customRules", target = "customRules")
    ScanConfigurationResponseDTO toResponseDTO(ScanConfiguration entity);
}
