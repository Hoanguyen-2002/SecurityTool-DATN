package com.backend.securitytool.service.flowanalyzer;

import com.backend.securitytool.mapper.BusinessFlowMapper;
import com.backend.securitytool.model.dto.request.BusinessFlowRequestDTO;
import com.backend.securitytool.model.dto.request.ApiEndpointParamDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowAnalysisResponseDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowStepResultDTO;
import com.backend.securitytool.model.entity.BusinessFlow;
import com.backend.securitytool.model.entity.SecurityIssue;
import com.backend.securitytool.repository.BusinessFlowRepository;
import com.backend.securitytool.repository.ScanResultRepository;
import com.backend.securitytool.repository.SecurityIssueRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlowAnalyzerServiceImpl implements FlowAnalyzerService {

    private static final Set<String> ECOMMERCE_HAPPY_PATH_ENDPOINTS = Set.of(
            "/api/v1/products",      // Example: View products
            "/api/v1/cart",          // Example: View cart
            "/api/v1/checkout",      // Example: Initiate checkout
            "/api/v1/auth/login",    // Example: User login
            "/api/v1/auth/register"  // Example: User registration
    );

    private final BusinessFlowRepository businessFlowRepository;
    private final ScanResultRepository scanResultRepository;
    private final BusinessFlowMapper businessFlowMapper;
    private final SecurityIssueRepository securityIssueRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public BusinessFlowResponseDTO createFlow(BusinessFlowRequestDTO requestDTO) {
        // Validate resultId is SonarQube scan result and belongs to appId
        if (requestDTO.getResultId() != null) {
            var scanResultOpt = scanResultRepository.findById(requestDTO.getResultId());
            if (scanResultOpt.isEmpty()) {
                throw new RuntimeException("Scan result not found");
            }
            var scanResult = scanResultOpt.get();
            if (!"static".equalsIgnoreCase(scanResult.getScanType())) {
                throw new RuntimeException("Only SonarQube scan result is allowed for business flow. Please provide a valid SonarQube scan result id.");
            }
            if (requestDTO.getAppId() == null || scanResult.getApp() == null || !scanResult.getApp().getId().equals(requestDTO.getAppId())) {
                throw new RuntimeException("Scan result does not belong to the specified application");
            }
        }

        // Validate flow name is unique within the same app
        if (requestDTO.getFlowName() != null && requestDTO.getAppId() != null) {
            BusinessFlow flowExists = businessFlowRepository.findByFlowNameAndAppId(requestDTO.getFlowName(), requestDTO.getAppId());
            if (flowExists != null) {
                throw new RuntimeException("A business flow with name '" + requestDTO.getFlowName() + "' already exists in this application");
            }
        } else {
            throw new RuntimeException("Flow name and appId are required");
        }

        BusinessFlow entity = businessFlowMapper.toEntity(requestDTO);
        if (requestDTO.getAppId() != null) {
            entity.setApp(businessFlowMapper.toEntity(requestDTO).getApp());
        }
        BusinessFlow saved = businessFlowRepository.save(entity);
        return businessFlowMapper.toResponseDTO(saved);
    }

    @Override
    public BusinessFlowResponseDTO editFlow(Integer id, BusinessFlowRequestDTO requestDTO) {
        Optional<BusinessFlow> optional = businessFlowRepository.findById(id);
        if (optional.isEmpty()) {
            throw new RuntimeException("Business flow not found");
        }
        // Validate resultId is SonarQube scan result and belongs to appId
        if (requestDTO.getResultId() != null) {
            var scanResultOpt = scanResultRepository.findById(requestDTO.getResultId());
            if (scanResultOpt.isEmpty()) {
                throw new RuntimeException("Scan result not found");
            }
            var scanResult = scanResultOpt.get();
            if (!"static".equalsIgnoreCase(scanResult.getScanType())) {
                throw new RuntimeException("Only SonarQube scan result is allowed for business flow. Please provide a valid SonarQube scan result id.");
            }
            if (requestDTO.getAppId() == null || scanResult.getApp() == null || !scanResult.getApp().getId().equals(requestDTO.getAppId())) {
                throw new RuntimeException("Scan result does not belong to the specified application");
            }
        }

        BusinessFlow entity = optional.get();

        // Validate flow name uniqueness within the same app when changing name or app
        if (requestDTO.getFlowName() != null && requestDTO.getAppId() != null &&
            (!requestDTO.getFlowName().equals(entity.getFlowName()) || !requestDTO.getAppId().equals(entity.getApp() != null ? entity.getApp().getId() : null))) {
            BusinessFlow flowExists = businessFlowRepository.findByFlowNameAndAppId(requestDTO.getFlowName(), requestDTO.getAppId());
            if (flowExists != null && !flowExists.getId().equals(id)) {
                throw new RuntimeException("A business flow with name '" + requestDTO.getFlowName() + "' already exists in this application");
            }
        }
        // Update fields
        entity.setFlowName(requestDTO.getFlowName());
        entity.setFlowDescription(requestDTO.getFlowDescription());
        BusinessFlow temp = businessFlowMapper.toEntity(requestDTO);
        entity.setApiEndpoints(temp.getApiEndpoints());
        if (requestDTO.getResultId() != null) {
            entity.setResult(temp.getResult());
        }
        if (requestDTO.getAppId() != null) {
            entity.setApp(temp.getApp());
        }
        entity.setUpdatedAt(Instant.now());
        BusinessFlow saved = businessFlowRepository.save(entity);
        return businessFlowMapper.toResponseDTO(saved);
    }


    @Override
    public List<BusinessFlowResponseDTO> getListFlowWihoutPagination(Integer appId) {
        List<BusinessFlow> flows;
        if (appId != null) {
            flows = businessFlowRepository.findByAppId(appId);
        } else {
            flows = businessFlowRepository.findAll();
        }
        return flows.stream().map(businessFlowMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public Page<BusinessFlowResponseDTO> getListFlow(Integer appId, int page, int size) {
        // Adjust page to be zero-based for Spring Data
        int pageIndex = Math.max(page - 1, 0);
        Pageable pageable = PageRequest.of(pageIndex, size);
        Page<BusinessFlow> flowPage;
        if (appId != null) {
            flowPage = businessFlowRepository.findByAppId(appId, pageable);
        } else {
            flowPage = businessFlowRepository.findAll(pageable);
        }
        List<BusinessFlowResponseDTO> dtoList = flowPage.getContent().stream()
                .map(businessFlowMapper::toResponseDTO)
                .toList();
        return new PageImpl<>(dtoList, pageable, flowPage.getTotalElements());
    }

    @Override
    public void deleteFlow(Integer id) {
        businessFlowRepository.deleteById(id);
    }

    @Override
    public BusinessFlowAnalysisResponseDTO analyze(BusinessFlowRequestDTO requestDTO) {
        List<String> endpointPaths = new ArrayList<>();

        // Nếu apiEndpoints là null hoặc rỗng, thử parse từ JSON string (trường hợp lấy từ DB hoặc FE gửi sai dạng)
        if (requestDTO.getApiEndpoints() == null || requestDTO.getApiEndpoints().isEmpty()) {
            // Không có endpoint nào, trả về kết quả rỗng
            return new BusinessFlowAnalysisResponseDTO(
                    requestDTO.getFlowName(),
                    requestDTO.getFlowDescription(),
                    0, 0, 0, true, new ArrayList<>()
            );
        } else {
            // Kiểm tra nếu phần tử đầu tiên là String (FE gửi sai dạng), parse lại từ JSON string
            Object first = requestDTO.getApiEndpoints().get(0);
            if (first instanceof String) {
                // FE gửi lên là List<String>, cần chuyển thành List<ApiEndpointParamDTO>
                for (Object obj : requestDTO.getApiEndpoints()) {
                    if (obj instanceof String) {
                        endpointPaths.add((String) obj);
                    }
                }
            } else {
                // Đúng dạng List<ApiEndpointParamDTO>
                for (ApiEndpointParamDTO dto : requestDTO.getApiEndpoints()) {
                    if (dto != null && dto.getEndpoint() != null) {
                        endpointPaths.add(dto.getEndpoint());
                    }
                }
            }
        }

        List<SecurityIssue> issues = securityIssueRepository.findByResultId(requestDTO.getResultId());
        Map<String, List<SecurityIssue>> issueMap = issues.stream()
                .filter(issue -> issue.getEndpoint() != null && issue.getEndpoint().getPath() != null)
                .collect(Collectors.groupingBy(issue -> issue.getEndpoint().getPath()));

        List<BusinessFlowStepResultDTO> stepResults = new ArrayList<>();
        int totalStaticIssues = 0;
        int passedSteps = 0;
        for (String endpoint : endpointPaths) {
            int staticCount = issueMap.getOrDefault(endpoint, Collections.emptyList()).size();
            boolean passed = staticCount == 0;
            if (passed) passedSteps++;
            totalStaticIssues += staticCount;
            stepResults.add(new BusinessFlowStepResultDTO(endpoint, staticCount, passed));
        }
        int totalSteps = endpointPaths.size();
        boolean overallPassed = (passedSteps == totalSteps) && (totalStaticIssues == 0);

        // Calculate happy path progress for ECOMMERCE_HAPPY_PATH_ENDPOINTS
        int happyTotal = 0;
        int happyPassed = 0;
        for (String happyEndpoint : ECOMMERCE_HAPPY_PATH_ENDPOINTS) {
            happyTotal++;
            int staticCount = issueMap.getOrDefault(happyEndpoint, Collections.emptyList()).size();
            boolean present = endpointPaths.contains(happyEndpoint);
            boolean passed = present && staticCount == 0;
            if (passed) happyPassed++;
        }
        System.out.println("[E-COMMERCE HAPPY PATH PROGRESS]");
        System.out.println("Happy path endpoints present: " + happyPassed + "/" + happyTotal);

        return new BusinessFlowAnalysisResponseDTO(
                requestDTO.getFlowName(),
                requestDTO.getFlowDescription(),
                totalSteps,
                passedSteps,
                totalStaticIssues,
                overallPassed,
                stepResults
        );
    }
}
