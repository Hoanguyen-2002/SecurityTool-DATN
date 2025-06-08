package com.backend.securitytool.service.report;

import com.backend.securitytool.mapper.SecurityIssueMapper;
import com.backend.securitytool.model.dto.response.ReportResponseDTO;
import com.backend.securitytool.model.dto.response.SecurityIssueResponseDTO;
import com.backend.securitytool.model.entity.SecurityIssue;
import com.backend.securitytool.model.entity.ScanResult;
import com.backend.securitytool.repository.SecurityIssueRepository;
import com.backend.securitytool.repository.ScanResultRepository;
import com.backend.securitytool.util.ReportExporter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportServiceImpl.class);

    private SecurityIssueRepository securityIssueRepository;
    private SecurityIssueMapper securityIssueMapper;
    private ScanResultRepository scanResultRepository;

    @Autowired
    public ReportServiceImpl(SecurityIssueRepository securityIssueRepository, SecurityIssueMapper securityIssueMapper, ScanResultRepository scanResultRepository) {
        this.securityIssueRepository = securityIssueRepository;
        this.securityIssueMapper = securityIssueMapper;
        this.scanResultRepository = scanResultRepository;
    }

    @Override
    public ReportResponseDTO getReport(Integer resultId, Integer appId) {
        logger.debug("Fetching all issues for resultId: {} and appId: {}", resultId, appId);

        // Validate resultId belongs to appId
        ScanResult scanResult = scanResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Scan result not found"));
        Integer actualAppId = scanResult.getApp() != null ? scanResult.getApp().getId() : null;
        if (appId != null && !appId.equals(actualAppId)) {
            throw new RuntimeException("Scan result does not belong to the specified application");
        }

        List<SecurityIssue> issues = securityIssueRepository.findByResultId(resultId);
        List<SecurityIssueResponseDTO> issueDTOs = issues.stream()
                .map(securityIssueMapper::toResponseDTO)
                .collect(Collectors.toList());

        ReportResponseDTO report = new ReportResponseDTO();
        report.setResultId(resultId);
        report.setAppId(actualAppId);
        report.setIssues(issueDTOs);

        logger.info("Retrieved {} issues for resultId: {}", issues.size(), resultId);
        return report;
    }

    @Override
    public String exportCsv(Integer resultId) {
        logger.debug("Exporting CSV for resultId: {}", resultId);
        List<SecurityIssue> issues = securityIssueRepository.findByResultId(resultId);
        String csv = ReportExporter.toCsv(issues);
        logger.info("CSV export completed for resultId: {}", resultId);
        return csv;
    }
}
