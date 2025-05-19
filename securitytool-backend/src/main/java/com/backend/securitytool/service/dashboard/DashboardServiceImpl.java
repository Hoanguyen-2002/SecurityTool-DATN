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
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private static final Logger logger = LoggerFactory.getLogger(DashboardServiceImpl.class);

    private final TargetApplicationRepository targetApplicationRepository;
    private final ScanResultRepository scanResultRepository;
    private final SecurityIssueRepository securityIssueRepository;
    private final DashboardStatsMapper dashboardStatsMapper;

    @Override
    public DashboardStatsResponseDTO getStats(Integer appId) {
        logger.debug("Fetching dashboard statistics for appId: {}", appId);
        DashboardStatsResponseDTO stats = new DashboardStatsResponseDTO();

        if (appId == null) {
            logger.warn("Null appId provided, returning empty statistics");
            return stats;
        }

        try {
            // Scan counts by type for this app
            long staticScanCount = scanResultRepository.countByAppIdAndScanType(appId, "static");
            long dynamicScanCount = scanResultRepository.countByAppIdAndScanType(appId, "dynamic");
            stats.setStaticScanCount(staticScanCount);
            stats.setDynamicScanCount(dynamicScanCount);
            
            // Total issues for this app
            long totalIssues = securityIssueRepository.countByAppId(appId);
            stats.setTotalIssues(totalIssues);

            // Severity distribution for this app
            List<Object[]> severityCounts = securityIssueRepository.countBySeverityAndAppId(appId);
            if (severityCounts != null && !severityCounts.isEmpty()) {
                stats.setSeverityDistribution(
                    dashboardStatsMapper.mapSeverityDistribution(severityCounts)
                );
            } else {
                // If no issues found for this app, set empty distribution
                stats.setSeverityDistribution(new HashMap<>());
            }
        } catch (Exception e) {
            logger.error("Error fetching dashboard statistics for appId {}: {}", appId, e.getMessage());
            // Set default values in case of error
            stats.setTotalIssues(0);
            stats.setSeverityDistribution(new HashMap<>());
        }

        logger.info("Dashboard statistics for appId {} retrieved successfully", appId);
        return stats;
    }
}
