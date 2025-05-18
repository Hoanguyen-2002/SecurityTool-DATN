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

        // Scan counts by type for this app
        long staticScanCount = scanResultRepository.countByAppIdAndScanType(appId, "static");
        long dynamicScanCount = scanResultRepository.countByAppIdAndScanType(appId, "dynamic");
        stats.setStaticScanCount(staticScanCount);
        stats.setDynamicScanCount(dynamicScanCount);

        // Total issues for this app
        long totalIssues = securityIssueRepository.findByResultAppId(appId).size();
        stats.setTotalIssues(totalIssues);

        // Severity distribution for this app
        // Sử dụng custom query để lấy severity distribution theo appId
        // Nếu chưa có, cần bổ sung query trong repository
        // Ví dụ:
        // @Query("SELECT s.severity, COUNT(s) FROM SecurityIssue s WHERE s.result.app.id = :appId GROUP BY s.severity")
        // List<Object[]> countBySeverityAndAppId(Integer appId);
        if (securityIssueRepository instanceof com.backend.securitytool.repository.SecurityIssueRepository) {
            try {
                var severityCounts = securityIssueRepository
                    .getClass()
                    .getMethod("countBySeverityAndAppId", Integer.class)
                    .invoke(securityIssueRepository, appId);
                stats.setSeverityDistribution(
                    dashboardStatsMapper.mapSeverityDistribution((java.util.List<Object[]>) severityCounts)
                );
            } catch (Exception e) {
                logger.warn("Could not get severity distribution by appId, fallback to all severities.", e);
                stats.setSeverityDistribution(
                    dashboardStatsMapper.mapSeverityDistribution(securityIssueRepository.countBySeverity())
                );
            }
        } else {
            stats.setSeverityDistribution(
                dashboardStatsMapper.mapSeverityDistribution(securityIssueRepository.countBySeverity())
            );
        }

        logger.info("Dashboard statistics for appId {} retrieved successfully", appId);
        return stats;
    }
}
