package com.backend.securitytool.service.appmanagement.module;

import com.backend.securitytool.model.dto.request.ModuleRequestDTO;
import com.backend.securitytool.model.dto.response.ModuleResponseDTO;

import java.util.List;

public interface ModuleService {
    ModuleResponseDTO create(ModuleRequestDTO dto);
    List<ModuleResponseDTO> list();
    ModuleResponseDTO update(Integer id, ModuleRequestDTO dto);
    void delete(Integer id);
}
