package com.backend.securitytool.service.report;

import com.backend.securitytool.mapper.SecurityIssueMapper;
import com.backend.securitytool.model.dto.response.ReportResponseDTO;
import com.backend.securitytool.model.dto.response.SecurityIssueResponseDTO;
import com.backend.securitytool.model.entity.SecurityIssue;
import com.backend.securitytool.repository.SecurityIssueRepository;
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

    @Autowired
    public ReportServiceImpl(SecurityIssueRepository securityIssueRepository, SecurityIssueMapper securityIssueMapper) {
        this.securityIssueRepository = securityIssueRepository;
        this.securityIssueMapper = securityIssueMapper;
    }

    @Override
    public ReportResponseDTO getReport(Integer resultId) {
        logger.debug("Fetching all issues for resultId: {}", resultId);

        List<SecurityIssue> issues = securityIssueRepository.findByResultId(resultId);
        List<SecurityIssueResponseDTO> issueDTOs = issues.stream()
                .map(securityIssueMapper::toResponseDTO)
                .collect(Collectors.toList());

        Integer appId = null;
        if (!issues.isEmpty()) {
            appId = issues.get(0).getAppId();
        }

        ReportResponseDTO report = new ReportResponseDTO();
        report.setResultId(resultId);
        report.setAppId(appId);
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
