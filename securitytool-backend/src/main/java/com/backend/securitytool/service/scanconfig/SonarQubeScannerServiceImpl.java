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
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Service
@Slf4j
public class SonarQubeScannerServiceImpl implements SonarQubeScannerService {
    private static final Logger logger = LoggerFactory.getLogger(SonarQubeScannerServiceImpl.class);

    private final ScanResultRepository scanResultRepository;
    private final ScanResultMapper scanResultMapper;
    private final TargetApplicationRepository targetApplicationRepository;
    private final RestTemplate restTemplate;

    @Autowired
    public SonarQubeScannerServiceImpl(ScanResultRepository scanResultRepository,
                                       ScanResultMapper scanResultMapper,
                                       TargetApplicationRepository targetApplicationRepository) {
        this.scanResultRepository = scanResultRepository;
        this.scanResultMapper = scanResultMapper;
        this.targetApplicationRepository = targetApplicationRepository;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public ScanResponseDTO scan(Integer appId, String projectKey) {
        logger.debug("Starting SonarQube scan for appId: {}, projectKey: {}", appId, projectKey);

        TargetApplication app = targetApplicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + appId));

        HttpHeaders headers = new HttpHeaders();
        if (app.getAuthInfo() != null && !app.getAuthInfo().isEmpty()) {
            try {
                String decryptedToken = EncryptionUtil.decrypt(app.getAuthInfo());
                String auth = decryptedToken + ":";
                byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes(StandardCharsets.UTF_8));
                String authHeader = "Basic " + new String(encodedAuth);
                headers.set(HttpHeaders.AUTHORIZATION, authHeader);
                logger.info("Using Authorization header for SonarQube scan for app ID: {}", appId);
            } catch (Exception e) {
                logger.error("Failed to decrypt auth info for SonarQube scan, app ID: {}. Error: {}", appId, e.getMessage(), e);
                throw new EncryptionException(ErrorMessages.DECRYPTION_FAILED + " for SonarQube token. Please check the configured authInfo for application ID " + appId, e);
            }
        } else {
            logger.warn("No authInfo found for SonarQube scan for app ID: {}. Proceeding without authentication. This may fail if the SonarQube project is not public.", appId);
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);
//        String sonarQubeUrl = "http://localhost:9000/api/issues/search?componentKeys=" + projectKey + "&resolved=false";
        String sonarQubeUrl = "http://localhost:9000/api/issues/search?componentKeys=" + "sqp_9797b07916a233f02fd8b5291521cd7e5af0327d" + "&resolved=false";
        ResponseEntity<String> responseEntity;
        try {
            logger.debug("Calling SonarQube API: URL='{}', Headers='{}'", sonarQubeUrl, headers.containsKey(HttpHeaders.AUTHORIZATION) ? "Authorization: [present]" : "Authorization: [not present]");
            responseEntity = restTemplate.exchange(sonarQubeUrl, HttpMethod.GET, entity, String.class);
        } catch (HttpClientErrorException e) {
            logger.error("HttpClientErrorException from SonarQube API: Status={}, Body={}, URL={}", e.getStatusCode(), e.getResponseBodyAsString(), sonarQubeUrl, e);
            String errorMessage = String.format("Failed to fetch data from SonarQube for projectKey '%s'. Status: %s. Response: %s. Ensure SonarQube is running and the project exists. If authentication is required, verify the token in authInfo.",
                    projectKey, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException(errorMessage, e);
        } catch (Exception e) {
            logger.error("Generic exception while calling SonarQube API: URL={}, Error={}", sonarQubeUrl, e.getMessage(), e);
            throw new RuntimeException("An unexpected error occurred while communicating with SonarQube: " + e.getMessage(), e);
        }

        ScanResult scanResult = new ScanResult();
        scanResult.setApp(app);
        scanResult.setScanDate(Instant.now());
        scanResult.setScanType(ScanType.SCAN_TYPE_STATIC);
        scanResult.setStatus(ScanType.SCAN_STATUS_COMPLETED);
        scanResult.setSummary(responseEntity.getBody());
        ScanResult savedResult = scanResultRepository.save(scanResult);
        logger.info("SonarQube scan completed and result saved for appId: {}", appId);
        return scanResultMapper.toResponseDTO(savedResult);
    }
}
