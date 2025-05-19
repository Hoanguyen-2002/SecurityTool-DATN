package com.backend.securitytool.service.scanconfig;

import com.backend.securitytool.constants.ErrorMessages;
import com.backend.securitytool.constants.ScanType;
import com.backend.securitytool.exception.ResourceNotFoundException;
import com.backend.securitytool.mapper.ScanResultMapper;
import com.backend.securitytool.model.dto.response.ScanResponseDTO;
import com.backend.securitytool.model.entity.ScanResult;
import com.backend.securitytool.model.entity.TargetApplication;
import com.backend.securitytool.model.entity.SecurityIssue;
import com.backend.securitytool.repository.ScanResultRepository;
import com.backend.securitytool.repository.TargetApplicationRepository;
import com.backend.securitytool.repository.SecurityIssueRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ZapScannerServiceImpl implements ZapScannerService {
    private static final Logger logger = LoggerFactory.getLogger(ZapScannerServiceImpl.class);
    private static final String ZAP_HOST = "http://localhost:8080";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private TargetApplicationRepository targetApplicationRepository;
    private ScanResultRepository scanResultRepository;
    private ScanResultMapper scanResultMapper;
    private SecurityIssueRepository securityIssueRepository;
    private final RestTemplate restTemplate;

    // Maximum size for the summary field to prevent database column overflow
    private static final int MAX_SUMMARY_LENGTH = 65000; // Safe limit for most TEXT columns
    private static final int MAX_ALERTS_TO_INCLUDE = 5; // Top 5 alerts

    @Autowired
    public ZapScannerServiceImpl(TargetApplicationRepository targetApplicationRepository, ScanResultRepository scanResultRepository, ScanResultMapper scanResultMapper, SecurityIssueRepository securityIssueRepository) {
        this.targetApplicationRepository = targetApplicationRepository;
        this.scanResultRepository = scanResultRepository;
        this.scanResultMapper = scanResultMapper;
        this.securityIssueRepository = securityIssueRepository;
        this.restTemplate = new RestTemplate();
    }

    public ScanResponseDTO scan(Integer appId, String targetUrl) {
        logger.debug("Starting ZAP scan for appId: {}, targetUrl: {}", appId, targetUrl);
        TargetApplication app = targetApplicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + appId));

        String finalTargetUrl = processTargetUrl(targetUrl);
        logger.info("Final target URL for ZAP scan: {}", finalTargetUrl);

        String scanUrl = UriComponentsBuilder.fromHttpUrl(ZAP_HOST + "/JSON/core/action/accessUrl/")
                .queryParam("url", finalTargetUrl)
                .toUriString();

        logger.info("Calling ZAP scan API: {}", scanUrl);
        restTemplate.exchange(scanUrl, HttpMethod.GET, null, String.class);

        logger.info("ZAP scan initiated, waiting for completion");

        String alertsUrl = UriComponentsBuilder.fromHttpUrl(ZAP_HOST + "/JSON/core/view/alerts/")
                .queryParam("baseurl", finalTargetUrl)
                .toUriString();

        logger.info("Calling ZAP alerts API: {}", alertsUrl);
        ResponseEntity<String> alertsResponse = restTemplate.exchange(
                alertsUrl, HttpMethod.GET, null, String.class);

        // Only top 5 alerts for summary
        String alertsJson = extractTop5AlertsFieldOnly(alertsResponse.getBody());

        // Remove square brackets if present
        if (alertsJson.startsWith("[") && alertsJson.endsWith("]")) {
            alertsJson = alertsJson.substring(1, alertsJson.length() - 1);
        }

        ScanResult scanResult = new ScanResult();
        scanResult.setApp(app);
        scanResult.setScanDate(Instant.now());
        scanResult.setScanType(ScanType.SCAN_TYPE_DYNAMIC);
        scanResult.setStatus(ScanType.SCAN_STATUS_COMPLETED);
        scanResult.setSummary(alertsJson);
        // Save to ensure ID is generated
        ScanResult savedResult = scanResultRepository.save(scanResult);

        // Save SecurityIssue for each alert (all alerts, not limited to top 5)
        try {
            saveAllZapAlertsToSecurityIssues(alertsResponse.getBody(), savedResult);
            logger.info("Security issues extracted and saved for scan result ID: {}", savedResult.getId());
        } catch (Exception e) {
            logger.error("Failed to extract and save security issues: {}", e.getMessage(), e);
        }
        logger.info("ZAP scan completed for appId: {}", appId);
        return scanResultMapper.toResponseDTO(savedResult);
    }

    /**
     * Process a URL to replace localhost with host.docker.internal
     */
    private String processTargetUrl(String url) {
        if (url == null) {
            return "";
        }
        
        if (url.contains("localhost")) {
            String processed = url.replace("localhost", "host.docker.internal");
            logger.info("Replaced localhost with host.docker.internal: {} -> {}", url, processed);
            return processed;
        }
        
        return url;
    }

    /**
     * Extracts only the value of the "alert" field from each alert object in the ZAP response,
     * limited to the top 5, and returns as a JSON array of strings.
     */
    private String extractTop5AlertsFieldOnly(String zapResponse) {
        try {
            JsonNode rootNode = objectMapper.readTree(zapResponse);
            ArrayNode simplifiedAlerts = objectMapper.createArrayNode();

            if (rootNode.has("alerts") && rootNode.get("alerts").isArray()) {
                JsonNode alertsNode = rootNode.get("alerts");
                int alertCount = 0;

                for (JsonNode alert : alertsNode) {
                    if (alertCount >= MAX_ALERTS_TO_INCLUDE) break;
                    if (alert.has("alert")) {
                        String alertName = alert.get("alert").asText();
                        // Truncate very long alert names
                        if (alertName.length() > 255) {
                            alertName = alertName.substring(0, 252) + "...";
                        }
                        simplifiedAlerts.add(alertName);
                        alertCount++;
                    }
                }
            }

            String result = simplifiedAlerts.toString();
            if (result.length() > MAX_SUMMARY_LENGTH) {
                result = result.substring(0, MAX_SUMMARY_LENGTH - 3) + "...]";
            }
            return result;

        } catch (Exception e) {
            logger.error("Error extracting alert names from ZAP response", e);
            return "[]";
        }
    }

    /**
     * Standardize the solution text for database storage.
     * - Remove excessive whitespace and line breaks.
     * - Remove duplicate lines.
     * - Remove markdown/HTML tags.
     * - Truncate if still too long.
     */
    private String standardizeSolution(String solution, int maxLength) {
        if (solution == null) return null;
        // Remove HTML tags
        solution = solution.replaceAll("<[^>]*>", " ");
        // Remove markdown (basic: *, _, #, `, >, - at line start)
        solution = solution.replaceAll("(?m)^[-*>#`_]+", " ");
        // Split into lines, trim, remove duplicates, join back
        String[] lines = solution.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        java.util.HashSet<String> seen = new java.util.HashSet<>();
        for (String line : lines) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty() && seen.add(trimmed)) {
                sb.append(trimmed).append(" ");
            }
        }
        String cleaned = sb.toString().replaceAll("\\s+", " ").trim();
        // Truncate if still too long
        if (cleaned.length() > maxLength) {
            cleaned = cleaned.substring(0, maxLength - 3) + "...";
        }
        return cleaned;
    }

    /**
     * Save all alerts from ZAP response as SecurityIssue entities (no top 5 limit).
     * Extract only risk, description, and solution fields.
     * Standardize solution before saving.
     */
    private void saveAllZapAlertsToSecurityIssues(String zapResponse, ScanResult scanResult) throws IOException {
        final int MAX_SOLUTION_LENGTH = 1000; // adjust to your DB column size
        ObjectMapper mapper = new ObjectMapper();
        JsonNode rootNode = mapper.readTree(zapResponse);
        JsonNode alerts = rootNode.path("alerts");
        if (alerts.isArray()) {
            for (JsonNode alert : alerts) {
                SecurityIssue issue = new SecurityIssue();
                issue.setResult(scanResult);
                issue.setAppId(scanResult.getApp().getId()); // Set appId from the scan result's app
                issue.setIssueType("Zap");
                issue.setSeverity(alert.path("risk").asText());
                issue.setDescription(alert.path("description").asText());
                String solution = alert.path("solution").asText();
                solution = standardizeSolution(solution, MAX_SOLUTION_LENGTH);
                issue.setSolution(solution);
                issue.setStatus("Open");
                securityIssueRepository.save(issue);
            }
        }
    }

    /**
     * Maps ZAP risk levels to SonarQube severity levels
     */
    private String mapZapRiskToSonarQubeSeverity(String zapRisk) {
        switch (zapRisk.toLowerCase()) {
            case "3":
            case "high":
                return "CRITICAL";
            case "2":
            case "medium":
                return "MAJOR";
            case "1":
            case "low":
                return "MINOR";
            case "0":
            case "informational":
                return "INFO";
            default:
                return "INFO";
        }
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

