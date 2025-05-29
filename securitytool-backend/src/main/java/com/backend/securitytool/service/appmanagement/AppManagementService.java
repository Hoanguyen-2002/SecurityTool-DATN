package com.backend.securitytool.service.appmanagement;

import com.backend.securitytool.model.dto.request.ApplicationRequestDTO;
import com.backend.securitytool.model.dto.response.ApplicationResponseDTO;
import com.backend.securitytool.model.dto.response.PagedApplicationResponseDTO;

import java.util.List;

public interface AppManagementService {
    PagedApplicationResponseDTO getApps(int page, int size);
    ApplicationResponseDTO addApp(ApplicationRequestDTO dto);
    ApplicationResponseDTO updateApp(Integer id, ApplicationRequestDTO dto);
    void deleteApp(Integer id);
    List<ApplicationResponseDTO> searchAppsByName(String appName);
}
