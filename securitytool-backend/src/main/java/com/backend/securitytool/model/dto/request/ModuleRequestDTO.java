package com.backend.securitytool.model.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ModuleRequestDTO {
    private String moduleName;
    private String description;
    private String repositoryPath;
}
