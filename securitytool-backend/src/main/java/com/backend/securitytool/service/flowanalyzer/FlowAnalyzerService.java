package com.backend.securitytool.service.flowanalyzer;

import com.backend.securitytool.model.dto.request.BusinessFlowRequestDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;

import java.util.List;

public interface FlowAnalyzerService {
    BusinessFlowResponseDTO createFlow(BusinessFlowRequestDTO requestDTO);
    BusinessFlowResponseDTO editFlow(Integer id, BusinessFlowRequestDTO requestDTO);
    List<BusinessFlowResponseDTO> getListFlow(Integer appId);
    void deleteFlow(Integer id);
}

