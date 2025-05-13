package com.backend.securitytool.model.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class SecurityIssueResponseDTO {
    private Integer id;
    private Integer resultId;
    private Integer endpointId;
    private String issueType;
    private String severity;
    private String description;
    private String remediation;
    private String solution;
    private String status;
    private Instant createdAt;
}

