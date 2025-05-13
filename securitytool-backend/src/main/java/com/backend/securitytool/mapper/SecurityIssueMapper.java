package com.backend.securitytool.mapper;

import com.backend.securitytool.model.dto.response.SecurityIssueResponseDTO;
import com.backend.securitytool.model.entity.SecurityIssue;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface SecurityIssueMapper {

    @Mapping(source = "id", target = "id")
    @Mapping(source = "issueType", target = "issueType")
    @Mapping(source = "severity", target = "severity")
    @Mapping(source = "description", target = "description")
    @Mapping(source = "remediation", target = "remediation")
    @Mapping(source = "solution", target = "solution")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "result.id", target = "resultId")
    @Mapping(source = "endpoint.id", target = "endpointId")
    @Mapping(target = "createdAt", ignore = true)
    SecurityIssueResponseDTO toResponseDTO(SecurityIssue entity);
}
