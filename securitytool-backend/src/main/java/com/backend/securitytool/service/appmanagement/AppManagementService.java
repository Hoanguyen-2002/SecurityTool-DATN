package com.backend.securitytool.service.appmanagement;

import com.backend.securitytool.model.dto.request.ApplicationRequestDTO;
import com.backend.securitytool.model.dto.response.ApplicationResponseDTO;

import java.util.List;

public interface AppManagementService {
    List<ApplicationResponseDTO> getApps();
    ApplicationResponseDTO addApp(ApplicationRequestDTO dto);
    ApplicationResponseDTO updateApp(Integer id, ApplicationRequestDTO dto);
    void deleteApp(Integer id);
    List<ApplicationResponseDTO> searchAppsByName(String appName);
}
