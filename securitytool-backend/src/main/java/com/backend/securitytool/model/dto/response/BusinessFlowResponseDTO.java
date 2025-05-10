package com.backend.securitytool.model.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class BusinessFlowResponseDTO {
    private Integer id;
    private Integer appId;
    private String flowName;
    private String flowDescription;
    private String stepsJson;
}
