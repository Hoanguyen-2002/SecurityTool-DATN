package com.backend.securitytool.service.scanconfig;

import com.backend.securitytool.model.dto.request.ScanRequestDTO;
import com.backend.securitytool.model.dto.response.ScanResponseDTO;

import java.util.List;

public interface SonarQubeScannerService {
    ScanResponseDTO scan(ScanRequestDTO requestDTO);
    List<ScanResponseDTO> getAllScansByAppId(Integer appId);
}




