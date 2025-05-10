package com.backend.securitytool.service.report;

import com.backend.securitytool.model.dto.response.ReportResponseDTO;

public interface ReportService {
    ReportResponseDTO getReport(Integer resultId);
    String exportCsv(Integer resultId);
}
