package com.backend.securitytool.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BusinessFlowStepResultDTO {
    private String endpoint;
    private int staticIssueCount;
    private boolean passed;
}

