package com.backend.securitytool.model.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
public class DashboardStatsResponseDTO {
    private long staticScanCount;
    private long dynamicScanCount;
    private long totalIssues;
    private Map<String, Integer> severityDistribution;
}
