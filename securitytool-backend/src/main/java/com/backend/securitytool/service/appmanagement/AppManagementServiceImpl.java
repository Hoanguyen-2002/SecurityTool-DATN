package com.backend.securitytool.service.appmanagement;

import com.backend.securitytool.constants.ErrorMessages;
import com.backend.securitytool.exception.EncryptionException;
import com.backend.securitytool.exception.ResourceNotFoundException;
import com.backend.securitytool.mapper.ApplicationMapper;
import com.backend.securitytool.model.dto.request.ApplicationRequestDTO;
import com.backend.securitytool.model.dto.response.ApplicationResponseDTO;
import com.backend.securitytool.model.dto.response.PagedApplicationResponseDTO;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    public PagedApplicationResponseDTO getApps(int page, int size) {
        logger.debug("Fetching applications from database with pagination: page={}, size={}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<TargetApplication> appPage = repository.findAll(pageable);
        List<ApplicationResponseDTO> content = appPage.getContent().stream()
                .map(applicationMapper::toResponseDTO)
                .collect(Collectors.toList());
        return new PagedApplicationResponseDTO(
                content,
                appPage.getNumber()+1,
                appPage.getSize(),
                appPage.getTotalElements(),
                appPage.getTotalPages()
        );
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
        app.setUpdatedAt(java.time.Instant.now()); // Update the updatedAt field
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

    @Override
    public List<ApplicationResponseDTO> searchAppsByName(String appName) {
        logger.debug("Searching applications by name: {}", appName);
        List<TargetApplication> apps = repository.findByAppNameContainingIgnoreCase(appName);
        return apps.stream()
                .map(applicationMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
}
