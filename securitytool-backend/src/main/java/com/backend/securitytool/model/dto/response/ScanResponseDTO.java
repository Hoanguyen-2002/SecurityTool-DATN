package com.backend.securitytool.model.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class ScanResponseDTO {
    private Integer id;
    private Integer appId;
    private Instant scanDate;
    private String scanType;
    private String status;
    private String summary; // JSON as string
}
