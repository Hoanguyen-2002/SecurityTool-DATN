package com.backend.securitytool.mapper;

import com.backend.securitytool.model.dto.response.SecurityIssueResponseDTO;
import com.backend.securitytool.model.entity.SecurityIssue;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.stereotype.Component;


@Mapper(componentModel = "spring")
public interface SecurityIssueMapper {

    @Mapping(source = "result.id", target = "resultId")
    @Mapping(source = "endpoint.id", target = "endpointId")
    @Mapping(target = "createdAt", ignore = true)
    SecurityIssueResponseDTO toResponseDTO(SecurityIssue entity);
}