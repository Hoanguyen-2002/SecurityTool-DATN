package com.backend.securitytool.model.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class FlowAnalysisRequestDTO {
    private Integer flowId;
    private Integer resultId;
}
