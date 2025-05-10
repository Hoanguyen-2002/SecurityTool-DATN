package com.backend.securitytool.controller;

import com.backend.securitytool.constants.ApiConstants;
import com.backend.securitytool.model.dto.response.CommonResponse;
import com.backend.securitytool.model.dto.response.DashboardStatsResponseDTO;
import com.backend.securitytool.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping(ApiConstants.DASHBOARD_BASE_URL)
@RequiredArgsConstructor
public class DashboardController {
    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<CommonResponse<DashboardStatsResponseDTO>> getStats() {
        DashboardStatsResponseDTO stats = dashboardService.getStats();
        CommonResponse<DashboardStatsResponseDTO> response = new CommonResponse<>(
                "success",
                "Dashboard statistics retrieved successfully",
                stats,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
