package com.backend.securitytool.mapper;

import com.backend.securitytool.model.dto.request.ModuleRequestDTO;
import com.backend.securitytool.model.dto.response.ModuleResponseDTO;
import com.backend.securitytool.model.entity.SourceCodeModule;
import org.mapstruct.Mapper;
import org.springframework.stereotype.Component;


@Mapper(componentModel = "spring")
public interface SourceCodeModuleMapper {
    SourceCodeModule toEntity(ModuleRequestDTO dto);
    ModuleResponseDTO toDto(SourceCodeModule entity);
}
