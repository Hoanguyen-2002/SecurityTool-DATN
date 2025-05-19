package com.backend.securitytool.service.scanconfig;

import com.backend.securitytool.constants.ErrorMessages;
import com.backend.securitytool.constants.ScanType;
import com.backend.securitytool.exception.ResourceNotFoundException;
import com.backend.securitytool.mapper.ScanResultMapper;
import com.backend.securitytool.model.dto.request.ScanRequestDTO;
import com.backend.securitytool.model.dto.response.ScanResponseDTO;
import com.backend.securitytool.model.entity.ScanResult;
import com.backend.securitytool.model.entity.SecurityIssue;
import com.backend.securitytool.model.entity.TargetApplication;
import com.backend.securitytool.repository.ScanResultRepository;
import com.backend.securitytool.repository.SecurityIssueRepository;
import com.backend.securitytool.repository.TargetApplicationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SonarQubeScannerServiceImpl implements SonarQubeScannerService {
    private static final Logger logger = LoggerFactory.getLogger(SonarQubeScannerServiceImpl.class);

    private final ScanResultRepository scanResultRepository;
    private final ScanResultMapper scanResultMapper;
    private final TargetApplicationRepository targetApplicationRepository;
    private final RestTemplate restTemplate;
    private final SecurityIssueRepository securityIssueRepository;

    @Autowired
    public SonarQubeScannerServiceImpl(ScanResultRepository scanResultRepository,
                                       ScanResultMapper scanResultMapper,
                                       TargetApplicationRepository targetApplicationRepository, SecurityIssueRepository securityIssueRepository, SecurityIssueRepository securityIssueRepository1) {
        this.scanResultRepository = scanResultRepository;
        this.scanResultMapper = scanResultMapper;
        this.targetApplicationRepository = targetApplicationRepository;
        this.securityIssueRepository = securityIssueRepository1;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public List<ScanResponseDTO> getAllScansByAppId(Integer appId) {
        logger.debug("Fetching all SonarQube scans for appId: {}", appId);

        // Check if application exists
        targetApplicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + appId));

        // Find all scan results for this application with type STATIC
        List<ScanResult> scanResults = scanResultRepository.findByAppIdAndScanType(
                appId, ScanType.SCAN_TYPE_STATIC);

        // Map to DTOs
        List<ScanResponseDTO> scanResponses = scanResults.stream()
                .map(scanResultMapper::toResponseDTO)
                .collect(Collectors.toList());

        logger.info("Retrieved {} SonarQube scans for application ID: {}", scanResponses.size(), appId);
        return scanResponses;
    }

    @Override
    public ScanResponseDTO scan(ScanRequestDTO requestDTO) {
        Integer appId = requestDTO.getAppId();
        String projectKey = requestDTO.getProjectKey();
        logger.debug("Starting SonarQube scan for appId: {}, projectKey: {}", appId, projectKey);

        TargetApplication app = targetApplicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + appId));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");
        headers.set("User-Agent", "Mozilla/5.0");

        if (app.getAuthInfo() != null && !app.getAuthInfo().isEmpty()) {
            // Use authInfo directly without decryption
            String auth = app.getAuthInfo() + ":";
            byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes(StandardCharsets.UTF_8));
            String authHeader = "Basic " + new String(encodedAuth);
            headers.set(HttpHeaders.AUTHORIZATION, authHeader);
            logger.info("Using Authorization header for SonarQube scan for app ID: {}", appId);
        } else {
            logger.warn("No authInfo found for SonarQube scan for app ID: {}. Proceeding without authentication. This may fail if the SonarQube project is not public.", appId);
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);
        String sonarQubeUrl = "http://localhost:9000/api/measures/component?component=" + projectKey +
                "&metricKeys=bugs,reliability_rating,vulnerabilities,security_rating,security_hotspots," +
                "code_smells,sqale_debt_ratio,coverage,duplicated_lines_density";

        ResponseEntity<String> responseEntity;
        try {
            // Fixed syntax error in the log statement
            logger.debug("Calling SonarQube API: URL='{}', Headers='{}'", sonarQubeUrl,
                    headers.containsKey(HttpHeaders.AUTHORIZATION) ? "Authorization: [PRESENT]" : "Authorization: [NOT PRESENT]");
            responseEntity = restTemplate.exchange(sonarQubeUrl, HttpMethod.GET, entity, String.class);
        } catch (HttpClientErrorException e) {
            logger.error("HttpClientErrorException from SonarQube API: Status={}, Body={}, URL={}",
                    e.getStatusCode(), e.getResponseBodyAsString(), sonarQubeUrl, e);
            String errorMessage = String.format("Failed to fetch data from SonarQube for projectKey '%s'. Status: %s. Response: %s. " +
                            "Ensure SonarQube is running and the project exists. If authentication is required, verify the token in authInfo.",
                    projectKey, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException(errorMessage, e);
        } catch (Exception e) {
            logger.error("Generic exception while calling SonarQube API: URL={}, Error={}", sonarQubeUrl, e.getMessage(), e);
            throw new RuntimeException("An unexpected error occurred while communicating with SonarQube: " + e.getMessage(), e);
        }

        // Process the JSON response to extract only measures in a readable format
        String summaryText = "";
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(responseEntity.getBody());
            com.fasterxml.jackson.databind.JsonNode measuresArray = rootNode.path("component").path("measures");

            if (!measuresArray.isMissingNode() && measuresArray.isArray()) {
                StringBuilder summaryBuilder = new StringBuilder();

                for (com.fasterxml.jackson.databind.JsonNode measure : measuresArray) {
                    String metric = measure.path("metric").asText();
                    String value = measure.path("value").asText();
                    boolean bestValue = measure.path("bestValue").asBoolean();

                    String status = bestValue ? "good" : "bad";

                    if (summaryBuilder.length() > 0) {
                        summaryBuilder.append(", ");
                    }
                    summaryBuilder.append(metric).append(":").append(status);
                }

                summaryText = summaryBuilder.toString();
                logger.info("Successfully extracted and formatted measures from SonarQube response");
            } else {
                logger.warn("Measures array not found in SonarQube response");
                summaryText = "No measures data found";
            }
        } catch (Exception e) {
            logger.error("Error parsing SonarQube response: {}", e.getMessage());
            summaryText = "Error parsing response: " + e.getMessage();
        }

        ScanResult scanResult = new ScanResult();
        scanResult.setApp(app);
        scanResult.setScanDate(Instant.now());
        scanResult.setScanType(ScanType.SCAN_TYPE_STATIC);
        scanResult.setStatus(ScanType.SCAN_STATUS_COMPLETED);
        scanResult.setSummary(summaryText);

        ScanResult savedResult = scanResultRepository.save(scanResult);
        logger.info("SonarQube scan completed and result saved for appId: {}", appId);

        logger.info("SonarQube scan completed and result saved for appId: {}", appId);

        // Extract security issues from the response and save them
        try {
            saveSecurityIssues(responseEntity.getBody(), savedResult);
            logger.info("Security issues extracted and saved for scan result ID: {}", savedResult.getId());
        } catch (Exception e) {
            logger.error("Failed to extract and save security issues: {}", e.getMessage(), e);
        }

        return scanResultMapper.toResponseDTO(savedResult);
    }

    // Add this new private method to handle security issue extraction
    private void saveSecurityIssues(String responseBody, ScanResult scanResult) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode rootNode = mapper.readTree(responseBody);
        JsonNode measuresArray = rootNode.path("component").path("measures");

        if (measuresArray.isArray()) {
            for (JsonNode measure : measuresArray) {
                String metric = measure.path("metric").asText();
                String value = measure.path("value").asText();
                boolean bestValue = measure.path("bestValue").asBoolean();

                // Only create issues for metrics that aren't at their best value
                if (!bestValue) {
                    SecurityIssue issue = new SecurityIssue();
                    issue.setResult(scanResult);
                    issue.setAppId(scanResult.getApp().getId()); // Set appId from the scan result's app
                    issue.setIssueType("SonarQube");
                    issue.setSeverity(getSeverityForMetric(metric));
                    issue.setDescription(formatDescription(metric, value));
                    issue.setStatus("Open");
                    issue.setSolution(formatSolution(metric));

                    securityIssueRepository.save(issue);
                }
            }
        }
    }

    private String getSeverityForMetric(String metric) {
        switch (metric) {
            case "vulnerabilities":
            case "security_hotspots":
                return "High";
            case "bugs":
            case "reliability_rating":
                return "Medium";
            case "code_smells":
            case "duplicated_lines_density":
            case "sqale_debt_ratio":
            case "coverage":
            default:
                return "Low";
        }
    }

    private String formatDescription(String metric, String value) {
        switch (metric) {
            case "vulnerabilities":
                return "Found " + value + " security vulnerabilities";
            case "bugs":
                return "Found " + value + " bugs in the code";
            case "code_smells":
                return "Found " + value + " code smells";
            case "security_hotspots":
                return "Found " + value + " security hotspots to review";
            case "coverage":
                return "Code coverage is only " + value + "%";
            case "reliability_rating":
                return "Reliability rating is " + value + " (1=best, 5=worst)";
            case "security_rating":
                return "Security rating is " + value + " (1=best, 5=worst)";
            case "duplicated_lines_density":
                return "Code duplication is " + value + "%";
            case "sqale_debt_ratio":
                return "Technical debt ratio is " + value + "%";
            default:
                return metric + ": " + value;
        }
    }

    private String formatSolution(String metric) {
        switch (metric) {
            case "vulnerabilities":
                return "Review the identified security vulnerabilities in the SonarQube dashboard. Understand the nature of each vulnerability (e.g., SQL Injection, XSS) and apply the recommended SonarQube fix or consult security best practices for remediation. Update dependencies if the vulnerability is in a third-party library.";
            case "bugs":
                return "Analyze the bugs reported by SonarQube. Understand the logical error or incorrect behavior. Debug the code, fix the root cause, and add unit tests to prevent regressions.";
            case "code_smells":
                return "Examine the code smells. These indicate maintainability issues. Refactor the code according to SonarQube's suggestions or general clean code principles (e.g., reduce complexity, improve naming, remove duplication).";
            case "security_hotspots":
                return "Security hotspots are security-sensitive pieces of code that require manual review. Carefully examine each hotspot to confirm whether it's a true vulnerability. If it is, apply appropriate security measures. If not, mark it as 'Safe' in SonarQube.";
            case "coverage":
                return "Increase test coverage by writing more unit and integration tests for the untested parts of the codebase. Aim for a higher coverage percentage to ensure code reliability and catch regressions early.";
            case "reliability_rating": // A-E, where A is best
                return "Improve code reliability by addressing the underlying issues causing a poor rating (likely bugs or bad practices). Focus on fixing bugs and improving code quality to achieve a better reliability rating (closer to A).";
            case "security_rating": // A-E, where A is best
                return "Enhance security by fixing vulnerabilities and addressing security hotspots. A better security rating (closer to A) indicates fewer security risks.";
            case "duplicated_lines_density":
                return "Reduce code duplication by refactoring duplicated blocks into reusable methods, functions, or classes. This improves maintainability and reduces the risk of inconsistencies.";
            case "sqale_debt_ratio":
                return "Lower the technical debt ratio by addressing code smells, bugs, and vulnerabilities. Prioritize fixing issues that contribute most to the debt. This improves long-term maintainability and reduces development costs.";
            default:
                return "Consult the SonarQube documentation for specific guidance on addressing issues related to '" + metric + "'.";
        }
    }
}
