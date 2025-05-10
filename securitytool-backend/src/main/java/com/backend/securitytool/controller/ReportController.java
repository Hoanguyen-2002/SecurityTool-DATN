package com.backend.securitytool.controller;

import com.backend.securitytool.constants.ApiConstants;
import com.backend.securitytool.model.dto.response.CommonResponse;
import com.backend.securitytool.model.dto.response.ReportResponseDTO;
import com.backend.securitytool.model.dto.response.SecurityIssueResponseDTO;
import com.backend.securitytool.service.report.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.REPORTS_BASE_URL)
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping(ApiConstants.REPORT_ID_PATH)
    public ResponseEntity<CommonResponse<ReportResponseDTO>> getReport(@PathVariable Integer resultId) {
        ReportResponseDTO report = reportService.getReport(resultId);
        CommonResponse<ReportResponseDTO> response = new CommonResponse<>(
                "success",
                "Report retrieved successfully",
                report,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping(ApiConstants.REPORT_CSV_PATH)
    public ResponseEntity<CommonResponse<String>> exportCsv(@PathVariable Integer resultId) {
        String csv = reportService.exportCsv(resultId);
        CommonResponse<String> response = new CommonResponse<>(
                "success",
                "CSV report exported successfully",
                csv,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}