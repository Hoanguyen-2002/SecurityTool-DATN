package com.backend.securitytool.service.flowanalyzer;

import com.backend.securitytool.model.dto.response.SecurityIssueResponseDTO;

import java.util.List;

public interface FlowAnalyzerService {
    List<SecurityIssueResponseDTO> analyzeFlow(Integer flowId, Integer resultId);
    List<SecurityIssueResponseDTO> analyzeFlowWithEndpoint(Integer businessFlowId, Integer appId);
}
