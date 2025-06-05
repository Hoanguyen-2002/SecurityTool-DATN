package com.backend.securitytool.service.report;

import com.backend.securitytool.model.dto.response.ReportResponseDTO;
import com.backend.securitytool.model.dto.response.SecurityIssueResponseDTO;

import java.util.List;

public interface ReportService {
    ReportResponseDTO getReport(Integer resultId);
    String exportCsv(Integer resultId);
}
