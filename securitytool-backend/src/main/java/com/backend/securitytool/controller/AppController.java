package com.backend.securitytool.controller;


import com.backend.securitytool.constants.ApiConstants;
import com.backend.securitytool.model.dto.request.ApplicationRequestDTO;
import com.backend.securitytool.model.dto.response.CommonResponse;
import com.backend.securitytool.model.dto.response.ApplicationResponseDTO;
import com.backend.securitytool.service.appmanagement.AppManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.APPS_BASE_URL)
@RequiredArgsConstructor
public class AppController {

    private final AppManagementService appManagementService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<ApplicationResponseDTO>>> getAllApps() {
        List<ApplicationResponseDTO> apps = appManagementService.getApps();
        CommonResponse<List<ApplicationResponseDTO>> response = new CommonResponse<>(
                "success",
                "Applications retrieved successfully",
                apps,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<CommonResponse<List<ApplicationResponseDTO>>> searchAppsByName(@RequestParam String appName) {
        List<ApplicationResponseDTO> apps = appManagementService.searchAppsByName(appName);
        CommonResponse<List<ApplicationResponseDTO>> response = new CommonResponse<>(
                "success",
                "Applications retrieved successfully",
                apps,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<CommonResponse<ApplicationResponseDTO>> addApp(@RequestBody ApplicationRequestDTO appDTO) {
        ApplicationResponseDTO app = appManagementService.addApp(appDTO);
        CommonResponse<ApplicationResponseDTO> response = new CommonResponse<>(
                "success",
                "Application added successfully",
                app,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping(ApiConstants.APP_ID_PATH)
    public ResponseEntity<CommonResponse<ApplicationResponseDTO>> updateApp(@PathVariable Integer id, @RequestBody ApplicationRequestDTO appDTO) {
        ApplicationResponseDTO updatedApp = appManagementService.updateApp(id, appDTO);
        CommonResponse<ApplicationResponseDTO> response = new CommonResponse<>(
                "success",
                "Application updated successfully",
                updatedApp,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping(ApiConstants.APP_ID_PATH)
    public ResponseEntity<CommonResponse<Void>> deleteApp(@PathVariable Integer id) {
        appManagementService.deleteApp(id);
        CommonResponse<Void> response = new CommonResponse<>(
                "success",
                "Application deleted successfully",
                null,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.NO_CONTENT);
    }
}
