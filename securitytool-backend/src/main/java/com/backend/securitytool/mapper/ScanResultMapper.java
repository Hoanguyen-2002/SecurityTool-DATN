package com.backend.securitytool.mapper;

import com.backend.securitytool.model.dto.response.ScanResponseDTO;
import com.backend.securitytool.model.entity.ScanResult;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.stereotype.Component;


@Mapper(componentModel = "spring")
public interface ScanResultMapper {

    @Mapping(source = "app.id", target = "appId")
    @Mapping(source = "summary", target = "summary")
    ScanResponseDTO toResponseDTO(ScanResult entity);
}