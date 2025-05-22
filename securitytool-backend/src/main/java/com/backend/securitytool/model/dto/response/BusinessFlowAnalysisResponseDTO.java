package com.backend.securitytool.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
public class BusinessFlowAnalysisResponseDTO {
    private String flowName;
    private String flowDescription;
    private int totalSteps;
    private int passedSteps;
    private int totalStaticIssues;
    private boolean overallPassed;
    private List<BusinessFlowStepResultDTO> stepResults;
}
