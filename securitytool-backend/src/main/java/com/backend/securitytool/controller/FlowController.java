package com.backend.securitytool.controller;

import com.backend.securitytool.constants.ApiConstants;
import com.backend.securitytool.model.dto.request.BusinessFlowRequestDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;
import com.backend.securitytool.service.flowanalyzer.FlowAnalyzerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.FLOW_ANALYSIS_BASE_URL)
public class FlowController {

    @Autowired
    private FlowAnalyzerService flowAnalyzerService;

    @PostMapping
    public ResponseEntity<BusinessFlowResponseDTO> createFlow(@RequestBody BusinessFlowRequestDTO requestDTO) {
        BusinessFlowResponseDTO response = flowAnalyzerService.createFlow(requestDTO);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusinessFlowResponseDTO> editFlow(@PathVariable Integer id, @RequestBody BusinessFlowRequestDTO requestDTO) {
        BusinessFlowResponseDTO response = flowAnalyzerService.editFlow(id, requestDTO);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BusinessFlowResponseDTO>> getListFlow(@RequestParam(required = false) Integer appId) {
        List<BusinessFlowResponseDTO> flows = flowAnalyzerService.getListFlow(appId);
        return ResponseEntity.ok(flows);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlow(@PathVariable Integer id) {
        flowAnalyzerService.deleteFlow(id);
        return ResponseEntity.noContent().build();
    }
}
