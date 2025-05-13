package com.backend.securitytool.controller;

import com.backend.securitytool.constants.ApiConstants;
import com.backend.securitytool.model.dto.request.ApiEndpointRequestDTO;
import com.backend.securitytool.model.dto.request.ScanRequestDTO;
import com.backend.securitytool.model.dto.response.CommonResponse;
import com.backend.securitytool.model.dto.response.ScanResponseDTO;
import com.backend.securitytool.service.scanconfig.SonarQubeScannerService;
import com.backend.securitytool.service.scanconfig.ZapScannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.SCAN_BASE_URL)
@RequiredArgsConstructor
public class ScanController {

    @Autowired
    private SonarQubeScannerService sonarQubeScannerService;

    @Autowired
    private ZapScannerService zapScannerService;

    @GetMapping("/sonarqube/{appId}")
    public ResponseEntity<List<ScanResponseDTO>> getAllScansByAppId(@PathVariable Integer appId) {
        List<ScanResponseDTO> scans = sonarQubeScannerService.getAllScansByAppId(appId);
        return ResponseEntity.ok(scans);
    }

    @GetMapping("/zap/{appId}")
    public ResponseEntity<List<ScanResponseDTO>> getAllZapScansByAppId(@PathVariable Integer appId) {
        List<ScanResponseDTO> scans = zapScannerService.getAllScansByAppId(appId);
        return ResponseEntity.ok(scans);
    }

    @PostMapping(ApiConstants.SONARQUBE_SCAN_PATH)
    public ResponseEntity<CommonResponse<ScanResponseDTO>> runSonarQubeScan(
            @RequestBody ScanRequestDTO requestDTO,
            @RequestParam(required=false) Integer moduleId) {
        ScanResponseDTO result = sonarQubeScannerService.scan(requestDTO);
        CommonResponse<ScanResponseDTO> response = new CommonResponse<>(
                "success",
                "SonarQube scan completed successfully",
                result,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(ApiConstants.ZAP_SCAN_PATH)
    public ResponseEntity<CommonResponse<ScanResponseDTO>> runZapScan(@RequestBody ScanRequestDTO requestDTO) {
        ScanResponseDTO result = zapScannerService.scan(requestDTO.getAppId(), requestDTO.getTargetUrl());
        CommonResponse<ScanResponseDTO> response = new CommonResponse<>(
                "success",
                "ZAP scan completed successfully",
                result,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(ApiConstants.ZAP_SCAN_PATH + "/endpoints")
    public ResponseEntity<CommonResponse<ScanResponseDTO>> runZapScanOnEndpoint(@RequestBody ApiEndpointRequestDTO endpointDTO) {
        ScanResponseDTO result = zapScannerService.scanEndpoint(endpointDTO.getAppId(), endpointDTO.getPath());
        CommonResponse<ScanResponseDTO> response = new CommonResponse<>(
                "success",
                "ZAP scan on endpoint completed successfully",
                result,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}