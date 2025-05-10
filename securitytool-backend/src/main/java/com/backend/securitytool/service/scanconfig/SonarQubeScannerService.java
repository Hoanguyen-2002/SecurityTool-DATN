package com.backend.securitytool.service.scanconfig;

import com.backend.securitytool.model.dto.response.ScanResponseDTO;

public interface SonarQubeScannerService {
    ScanResponseDTO scan(Integer appId, String projectKey);
}
