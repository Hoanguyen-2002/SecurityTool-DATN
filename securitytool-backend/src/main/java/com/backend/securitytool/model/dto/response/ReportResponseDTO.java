package com.backend.securitytool.model.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class ReportResponseDTO {
    private Integer resultId;
    private Integer appId;
    private List<SecurityIssueResponseDTO> issues;
}
