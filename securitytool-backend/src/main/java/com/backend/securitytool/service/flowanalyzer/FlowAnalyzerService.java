package com.backend.securitytool.service.flowanalyzer;

import com.backend.securitytool.model.dto.request.BusinessFlowRequestDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowAnalysisResponseDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;
import org.springframework.data.domain.Page;

import java.util.List;

public interface FlowAnalyzerService {
    BusinessFlowResponseDTO createFlow(BusinessFlowRequestDTO requestDTO);
    BusinessFlowResponseDTO editFlow(Integer flowId, BusinessFlowRequestDTO requestDTO);
    List<BusinessFlowResponseDTO> getListFlowWihoutPagination(Integer appId);
    Page<BusinessFlowResponseDTO> getListFlow(Integer appId, int page, int size);
    void deleteFlow(Integer flowId);
    BusinessFlowAnalysisResponseDTO analyze(BusinessFlowRequestDTO requestDTO);
}

