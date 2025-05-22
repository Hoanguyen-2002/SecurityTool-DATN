package com.backend.securitytool.model.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class BusinessFlowResponseDTO {
    private Integer id;
    private String flowName;
    private Integer resultId;
    private List<String> apiEndpoints;
    private String flowDescription;
    private Integer appId;
}
