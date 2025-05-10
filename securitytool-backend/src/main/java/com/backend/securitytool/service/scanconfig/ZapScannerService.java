package com.backend.securitytool.service.scanconfig;

import com.backend.securitytool.model.dto.response.ScanResponseDTO;

public interface ZapScannerService {
    ScanResponseDTO scan(Integer appId, String targetUrl);
    ScanResponseDTO scanEndpoint(Integer appId, String endpointPath);
}
