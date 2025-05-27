package com.backend.securitytool.mapper;

import com.backend.securitytool.model.dto.request.ApplicationRequestDTO;
import com.backend.securitytool.model.dto.response.ApplicationResponseDTO;
import com.backend.securitytool.model.entity.TargetApplication;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.stereotype.Component;


@Mapper(componentModel = "spring")
public interface ApplicationMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "apiEndpoints", ignore = true)
    @Mapping(target = "businessFlows", ignore = true)
    @Mapping(target = "scanConfigurations", ignore = true)
    @Mapping(target = "scanResults", ignore = true)
    @Mapping(target = "scanStatus", constant = "pending")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "techStack", source = "techStack")
    TargetApplication toEntity(ApplicationRequestDTO dto);

    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "updatedAt", target = "updatedAt")
    @Mapping(source = "description", target = "description")
    @Mapping(source = "techStack", target = "techStack")
    ApplicationResponseDTO toResponseDTO(TargetApplication entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "apiEndpoints", ignore = true)
    @Mapping(target = "businessFlows", ignore = true)
    @Mapping(target = "scanConfigurations", ignore = true)
    @Mapping(target = "scanResults", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "description", source = "description")
    @Mapping(target = "techStack", source = "techStack")
    void updateEntityFromDTO(ApplicationRequestDTO dto, @MappingTarget TargetApplication entity);
}
