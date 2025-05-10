package com.backend.securitytool.service.flowanalyzer;

import com.backend.securitytool.constants.ErrorMessages;
import com.backend.securitytool.constants.ScanType;
import com.backend.securitytool.exception.ResourceNotFoundException;
import com.backend.securitytool.mapper.SecurityIssueMapper;
import com.backend.securitytool.model.dto.response.SecurityIssueResponseDTO;
import com.backend.securitytool.model.entity.BusinessFlow;
import com.backend.securitytool.model.entity.ScanResult;
import com.backend.securitytool.model.entity.SecurityIssue;
import com.backend.securitytool.repository.BusinessFlowRepository;
import com.backend.securitytool.repository.ScanResultRepository;
import com.backend.securitytool.repository.SecurityIssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

@Slf4j
public class FlowAnalyzerServiceImpl implements FlowAnalyzerService {
    private static final Logger logger = LoggerFactory.getLogger(FlowAnalyzerServiceImpl.class);

    private BusinessFlowRepository businessFlowRepository;
    private ScanResultRepository scanResultRepository;
    private SecurityIssueRepository securityIssueRepository;
    private SecurityIssueMapper securityIssueMapper;

    @Autowired
    public FlowAnalyzerServiceImpl(BusinessFlowRepository businessFlowRepository, ScanResultRepository scanResultRepository, SecurityIssueRepository securityIssueRepository, SecurityIssueMapper securityIssueMapper) {
        this.businessFlowRepository = businessFlowRepository;
        this.scanResultRepository = scanResultRepository;
        this.securityIssueRepository = securityIssueRepository;
        this.securityIssueMapper = securityIssueMapper;
    }

    public List<SecurityIssueResponseDTO> analyzeFlow(Integer flowId, Integer resultId) {
        logger.debug("Analyzing flow with flowId: {} and resultId: {}", flowId, resultId);
        BusinessFlow flow = businessFlowRepository.findById(flowId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.BUSINESS_FLOW_NOT_FOUND + flowId));
        ScanResult scanResult = scanResultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.SCAN_RESULT_NOT_FOUND + resultId));

        List<SecurityIssue> issues = new ArrayList<>();

        String expected = flow.getStepsJson().toString();
        String actual = scanResult.getSummary().toString();

        if (actual.contains("quantity = -1")) {
            SecurityIssue issue = new SecurityIssue();
            issue.setResult(new ScanResult());
            issue.getResult().setId(resultId);
            issue.setIssueType("Negative Quantity");
            issue.setSeverity(ScanType.SEVERITY_HIGH);
            issue.setDescription("Quantity must be positive");
            issue.setStatus(ScanType.ISSUE_STATUS_OPEN);
            issues.add(securityIssueRepository.save(issue));
        }

        logger.info("Flow analysis completed, found {} issues", issues.size());
        return issues.stream()
                .map(securityIssueMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<SecurityIssueResponseDTO> analyzeFlowWithEndpoint(Integer businessFlowId, Integer appId) {
        logger.debug("Analyzing flow with businessFlowId: {} and appId: {}", businessFlowId, appId);
        BusinessFlow flow = businessFlowRepository.findById(businessFlowId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.BUSINESS_FLOW_NOT_FOUND + businessFlowId));
        ScanResult scanResult = scanResultRepository.findFirstByAppIdOrderByScanDateDesc(appId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.SCAN_RESULT_NOT_FOUND + " for appId " + appId));

        List<SecurityIssue> issues = new ArrayList<>();

        String expected = flow.getStepsJson().toString();
        String actual = scanResult.getSummary().toString();

        if (actual.contains("quantity = -1")) {
            SecurityIssue issue = new SecurityIssue();
            issue.setResult(scanResult);
            issue.setIssueType("Negative Quantity");
            issue.setSeverity(ScanType.SEVERITY_HIGH);
            issue.setDescription("Quantity must be positive");
            issue.setStatus(ScanType.ISSUE_STATUS_OPEN);
            issues.add(securityIssueRepository.save(issue));
        }

        logger.info("Flow analysis with endpoint completed, found {} issues", issues.size());
        return issues.stream()
                .map(securityIssueMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
}
