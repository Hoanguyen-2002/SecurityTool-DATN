package com.backend.securitytool.service.flowanalyzer;

import com.backend.securitytool.model.dto.request.BusinessFlowRequestDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowAnalysisResponseDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;

import java.util.List;

public interface FlowAnalyzerService {
    BusinessFlowResponseDTO createFlow(BusinessFlowRequestDTO requestDTO);
    BusinessFlowResponseDTO editFlow(Integer flowId, BusinessFlowRequestDTO requestDTO);
    List<BusinessFlowResponseDTO> getListFlow(Integer appId);
    void deleteFlow(Integer flowId);
    BusinessFlowAnalysisResponseDTO analyze(BusinessFlowRequestDTO requestDTO);
}

