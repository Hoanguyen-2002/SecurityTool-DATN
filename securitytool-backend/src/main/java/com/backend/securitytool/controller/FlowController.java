package com.backend.securitytool.controller;

import com.backend.securitytool.constants.ApiConstants;
import com.backend.securitytool.model.dto.request.BusinessFlowRequestDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowAnalysisResponseDTO;
import com.backend.securitytool.model.dto.response.CommonResponse;
import com.backend.securitytool.service.flowanalyzer.FlowAnalyzerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.FLOW_ANALYSIS_BASE_URL)
public class FlowController {

    @Autowired
    private FlowAnalyzerService flowAnalyzerService;

    // Thêm flowId vào path cho các thao tác với flow
    @PostMapping
    public ResponseEntity<BusinessFlowResponseDTO> createFlow(@RequestBody BusinessFlowRequestDTO requestDTO) {
        BusinessFlowResponseDTO response = flowAnalyzerService.createFlow(requestDTO);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{flowId}")
    public ResponseEntity<BusinessFlowResponseDTO> editFlow(@PathVariable Integer flowId, @RequestBody BusinessFlowRequestDTO requestDTO) {
        BusinessFlowResponseDTO response = flowAnalyzerService.editFlow(flowId, requestDTO);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BusinessFlowResponseDTO>> getListFlow(@RequestParam(required = false) Integer appId) {
        List<BusinessFlowResponseDTO> flows = flowAnalyzerService.getListFlow(appId);
        return ResponseEntity.ok(flows);
    }

    @DeleteMapping("/{flowId}")
    public ResponseEntity<Void> deleteFlow(@PathVariable Integer flowId) {
        flowAnalyzerService.deleteFlow(flowId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/analyze")
    public ResponseEntity<CommonResponse<BusinessFlowAnalysisResponseDTO>> analyzeBusinessFlow(@RequestBody BusinessFlowRequestDTO requestDTO) {
        BusinessFlowAnalysisResponseDTO analysisResult = flowAnalyzerService.analyze(requestDTO);
        CommonResponse<BusinessFlowAnalysisResponseDTO> response = new CommonResponse<>(
                "success",
                "Business flow analyzed successfully",
                analysisResult,
                LocalDateTime.now()
        );
        return ResponseEntity.ok(response);
    }
}
