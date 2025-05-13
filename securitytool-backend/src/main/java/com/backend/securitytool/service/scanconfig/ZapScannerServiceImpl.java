package com.backend.securitytool.service.scanconfig;

import com.backend.securitytool.constants.ErrorMessages;
import com.backend.securitytool.constants.ScanType;
import com.backend.securitytool.exception.EncryptionException;
import com.backend.securitytool.exception.ResourceNotFoundException;
import com.backend.securitytool.mapper.ScanResultMapper;
import com.backend.securitytool.model.dto.response.ScanResponseDTO;
import com.backend.securitytool.model.entity.ScanResult;
import com.backend.securitytool.model.entity.TargetApplication;
import com.backend.securitytool.repository.ScanResultRepository;
import com.backend.securitytool.repository.TargetApplicationRepository;
import com.backend.securitytool.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ZapScannerServiceImpl implements ZapScannerService {
    private static final Logger logger = LoggerFactory.getLogger(ZapScannerServiceImpl.class);

    private TargetApplicationRepository targetApplicationRepository;
    private ScanResultRepository scanResultRepository;
    private ScanResultMapper scanResultMapper;
    private final RestTemplate restTemplate;

    @Autowired
    public ZapScannerServiceImpl(TargetApplicationRepository targetApplicationRepository, ScanResultRepository scanResultRepository, ScanResultMapper scanResultMapper) {
        this.targetApplicationRepository = targetApplicationRepository;
        this.scanResultRepository = scanResultRepository;
        this.scanResultMapper = scanResultMapper;
        this.restTemplate = new RestTemplate();
    }

    public ScanResponseDTO scan(Integer appId, String targetUrl) {
        logger.debug("Starting ZAP scan for appId: {}, targetUrl: {}", appId, targetUrl);
        TargetApplication app = targetApplicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + appId));

        String token = null;
        if (app.getAuthInfo() != null) {
            try {
                token = EncryptionUtil.decrypt(app.getAuthInfo());
            } catch (Exception e) {
                logger.error("Failed to decrypt auth info for app: {}", app.getAppName(), e);
                throw new EncryptionException(ErrorMessages.DECRYPTION_FAILED, e);
            }
        }

        HttpHeaders headers = new HttpHeaders();
        if (token != null) {
            headers.set("Authorization", "Bearer " + token);
        }

        String zapUrl = "http://localhost:8081/JSON/spider/action/scan/?url=" + app.getAppUrl() + targetUrl;
        ResponseEntity<String> response = restTemplate.exchange(zapUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        ScanResult scanResult = new ScanResult();
        scanResult.setApp(app);
        scanResult.setScanDate(Instant.now());
        scanResult.setScanType(ScanType.SCAN_TYPE_DYNAMIC);
        scanResult.setStatus(ScanType.SCAN_STATUS_COMPLETED);
        scanResult.setSummary(response.getBody());
        ScanResult savedResult = scanResultRepository.save(scanResult);
        logger.info("ZAP scan completed for appId: {}", appId);
        return scanResultMapper.toResponseDTO(savedResult);
    }

    public ScanResponseDTO scanEndpoint(Integer appId, String endpointPath) {
        logger.debug("Starting ZAP scan for endpoint on appId: {}, path: {}", appId, endpointPath);
        TargetApplication app = targetApplicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + appId));

        String token = null;
        if (app.getAuthInfo() != null) {
            try {
                token = EncryptionUtil.decrypt(app.getAuthInfo());
            } catch (Exception e) {
                logger.error("Failed to decrypt auth info for app: {}", app.getAppName(), e);
                throw new EncryptionException(ErrorMessages.DECRYPTION_FAILED, e);
            }
        }

        HttpHeaders headers = new HttpHeaders();
        if (token != null) {
            headers.set("Authorization", "Bearer " + token);
        }

        String zapUrl = "http://localhost:8081/JSON/spider/action/scan/?url=" + app.getAppUrl() + endpointPath;
        ResponseEntity<String> response = restTemplate.exchange(zapUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        ScanResult scanResult = new ScanResult();
        scanResult.setApp(app);
        scanResult.setScanDate(Instant.now());
        scanResult.setScanType(ScanType.SCAN_TYPE_DYNAMIC);
        scanResult.setStatus(ScanType.SCAN_STATUS_COMPLETED);
        scanResult.setSummary(response.getBody());
        ScanResult savedResult = scanResultRepository.save(scanResult);
        logger.info("ZAP scan on endpoint completed for appId: {}", appId);
        return scanResultMapper.toResponseDTO(savedResult);
    }

    @Override
    public List<ScanResponseDTO> getAllScansByAppId(Integer appId) {
        logger.debug("Fetching all ZAP scans for appId: {}", appId);

        // Find all scan results for this application with type DYNAMIC
        List<ScanResult> scanResults = scanResultRepository.findByAppIdAndScanType(
                appId, ScanType.SCAN_TYPE_DYNAMIC);

        // Map to DTOs
        List<ScanResponseDTO> scanResponses = scanResults.stream()
                .map(scanResultMapper::toResponseDTO)
                .collect(Collectors.toList());

        logger.info("Retrieved {} ZAP scans for application ID: {}", scanResponses.size(), appId);
        return scanResponses;
    }
}
