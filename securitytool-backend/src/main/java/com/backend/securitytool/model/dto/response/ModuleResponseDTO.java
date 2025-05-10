package com.backend.securitytool.model.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ModuleResponseDTO {
    private Integer id;
    private String moduleName;
    private String description;
    private String repositoryPath;
}
