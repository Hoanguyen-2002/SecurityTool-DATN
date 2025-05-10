package com.backend.securitytool.controller;

import com.backend.securitytool.constants.ApiConstants;
import com.backend.securitytool.model.dto.request.ApiEndpointRequestDTO;
import com.backend.securitytool.model.dto.request.FlowAnalysisRequestDTO;
import com.backend.securitytool.model.dto.response.CommonResponse;
import com.backend.securitytool.model.dto.response.SecurityIssueResponseDTO;
import com.backend.securitytool.service.flowanalyzer.FlowAnalyzerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.ANALYZE_BASE_URL)
public class FlowController {

    @Autowired
    private FlowAnalyzerService flowAnalyzerService;

    @PostMapping(ApiConstants.FLOW_ANALYSIS_PATH)
    public ResponseEntity<CommonResponse<List<SecurityIssueResponseDTO>>> analyzeFlow(@RequestBody FlowAnalysisRequestDTO requestDTO) {
        List<SecurityIssueResponseDTO> issues = flowAnalyzerService.analyzeFlow(requestDTO.getFlowId(), requestDTO.getResultId());
        CommonResponse<List<SecurityIssueResponseDTO>> response = new CommonResponse<>(
                "success",
                "Flow analysis completed successfully",
                issues,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(ApiConstants.FLOW_ANALYSIS_PATH + "/endpoints")
    public ResponseEntity<CommonResponse<List<SecurityIssueResponseDTO>>> analyzeFlowWithEndpoint(@RequestBody ApiEndpointRequestDTO endpointDTO) {
        List<SecurityIssueResponseDTO> issues = flowAnalyzerService.analyzeFlowWithEndpoint(endpointDTO.getBusinessFlowId(), endpointDTO.getAppId());
        CommonResponse<List<SecurityIssueResponseDTO>> response = new CommonResponse<>(
                "success",
                "Flow analysis with endpoint completed successfully",
                issues,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
