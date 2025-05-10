package com.backend.securitytool.service.dashboard;


import com.backend.securitytool.model.dto.response.DashboardStatsResponseDTO;

public interface DashboardService {
    DashboardStatsResponseDTO getStats();
}
