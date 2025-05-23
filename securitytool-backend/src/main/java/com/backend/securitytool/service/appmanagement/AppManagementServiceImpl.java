package com.backend.securitytool.service.appmanagement;

import com.backend.securitytool.constants.ErrorMessages;
import com.backend.securitytool.exception.EncryptionException;
import com.backend.securitytool.exception.ResourceNotFoundException;
import com.backend.securitytool.mapper.ApplicationMapper;
import com.backend.securitytool.model.dto.request.ApplicationRequestDTO;
import com.backend.securitytool.model.dto.response.ApplicationResponseDTO;
import com.backend.securitytool.model.entity.TargetApplication;
import com.backend.securitytool.util.EncryptionUtil;
import com.backend.securitytool.repository.TargetApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppManagementServiceImpl implements AppManagementService{
    private static final Logger logger = LoggerFactory.getLogger(AppManagementServiceImpl.class);


    private TargetApplicationRepository repository;
    private ApplicationMapper applicationMapper;

    @Autowired
    public AppManagementServiceImpl(TargetApplicationRepository repository, ApplicationMapper applicationMapper) {
        this.repository = repository;
        this.applicationMapper = applicationMapper;
    }

    @Cacheable("apps")
    public List<ApplicationResponseDTO> getApps() {
        logger.debug("Fetching all applications from database");
        List<TargetApplication> apps = repository.findAll();
        return apps.stream()
                .map(applicationMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "apps", allEntries = true)
    public ApplicationResponseDTO addApp(ApplicationRequestDTO dto) {
        logger.debug("Adding new application: {}", dto.getAppName());
        TargetApplication app = applicationMapper.toEntity(dto);
        if (dto.getAuthInfo() != null && !dto.getAuthInfo().isEmpty()) {
            app.setAuthInfo(dto.getAuthInfo());
        } else {
            app.setAuthInfo(null); // Explicitly set to null if authInfo is null or empty
        }
        TargetApplication savedApp = repository.save(app);
        return applicationMapper.toResponseDTO(savedApp);
    }

    @CacheEvict(value = "apps", allEntries = true)
    public ApplicationResponseDTO updateApp(Integer id, ApplicationRequestDTO dto) {
        logger.debug("Updating application with ID: {}", id);
        TargetApplication app = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + id));
        applicationMapper.updateEntityFromDTO(dto, app);
        if (dto.getAuthInfo() != null) {
            if (dto.getAuthInfo().isEmpty()) {
                app.setAuthInfo(null); // Set to null if DTO's authInfo is an empty string
            } else {
                app.setAuthInfo(dto.getAuthInfo()); // Set authInfo directly without encryption
            }
        }

        TargetApplication updatedApp = repository.save(app);
        return applicationMapper.toResponseDTO(updatedApp);
    }


    @CacheEvict(value = "apps", allEntries = true)
    public void deleteApp(Integer id) {
        logger.debug("Deleting application with ID: {}", id);
        TargetApplication app = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorMessages.APPLICATION_NOT_FOUND + id));
        repository.delete(app);
        logger.info("Application deleted successfully: {}", id);
    }
}
