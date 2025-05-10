package com.backend.securitytool.service.dashboard;

import com.backend.securitytool.mapper.DashboardStatsMapper;
import com.backend.securitytool.model.dto.response.DashboardStatsResponseDTO;
import com.backend.securitytool.repository.ScanResultRepository;
import com.backend.securitytool.repository.SecurityIssueRepository;
import com.backend.securitytool.repository.TargetApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private static final Logger logger = LoggerFactory.getLogger(DashboardServiceImpl.class);


    private TargetApplicationRepository targetApplicationRepository;
    private ScanResultRepository scanResultRepository;
    private SecurityIssueRepository securityIssueRepository;
    private DashboardStatsMapper dashboardStatsMapper;

    @Autowired
    public DashboardServiceImpl(TargetApplicationRepository targetApplicationRepository, ScanResultRepository scanResultRepository, SecurityIssueRepository securityIssueRepository, DashboardStatsMapper dashboardStatsMapper) {
        this.targetApplicationRepository = targetApplicationRepository;
        this.scanResultRepository = scanResultRepository;
        this.securityIssueRepository = securityIssueRepository;
        this.dashboardStatsMapper = dashboardStatsMapper;
    }

    @Override
    public DashboardStatsResponseDTO getStats() {
        logger.debug("Fetching dashboard statistics");
        DashboardStatsResponseDTO stats = new DashboardStatsResponseDTO();

        // Total applications
        long totalApps = targetApplicationRepository.count();
        stats.setTotalApps(totalApps);

        // Total scans
        long totalScans = scanResultRepository.count();
        stats.setTotalScans(totalScans);

        // Total security issues
        long totalIssues = securityIssueRepository.count();
        stats.setTotalIssues(totalIssues);

        // Severity distribution
        stats.setSeverityDistribution(dashboardStatsMapper.mapSeverityDistribution(securityIssueRepository.countBySeverity()));

        logger.info("Dashboard statistics retrieved successfully");
        return stats;
    }
}
