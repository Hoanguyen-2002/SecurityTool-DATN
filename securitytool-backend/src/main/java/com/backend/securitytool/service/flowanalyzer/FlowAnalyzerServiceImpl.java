package com.backend.securitytool.service.flowanalyzer;

import com.backend.securitytool.mapper.BusinessFlowMapper;
import com.backend.securitytool.model.dto.request.BusinessFlowRequestDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowAnalysisResponseDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowStepResultDTO;
import com.backend.securitytool.model.entity.BusinessFlow;
import com.backend.securitytool.model.entity.SecurityIssue;
import com.backend.securitytool.repository.BusinessFlowRepository;
import com.backend.securitytool.repository.ScanResultRepository;
import com.backend.securitytool.repository.SecurityIssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlowAnalyzerServiceImpl implements FlowAnalyzerService {

    private final BusinessFlowRepository businessFlowRepository;
    private final ScanResultRepository scanResultRepository;
    private final BusinessFlowMapper businessFlowMapper;
    private final SecurityIssueRepository securityIssueRepository;

    @Override
    public BusinessFlowResponseDTO createFlow(BusinessFlowRequestDTO requestDTO) {
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
        BusinessFlow entity = optional.get();
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
        BusinessFlow saved = businessFlowRepository.save(entity);
        return businessFlowMapper.toResponseDTO(saved);
    }

    @Override
    public List<BusinessFlowResponseDTO> getListFlow(Integer appId) {
        List<BusinessFlow> flows;
        if (appId != null) {
            flows = businessFlowRepository.findByAppId(appId);
        } else {
            flows = businessFlowRepository.findAll();
        }
        return flows.stream().map(businessFlowMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public void deleteFlow(Integer id) {
        businessFlowRepository.deleteById(id);
    }

    @Override
    public BusinessFlowAnalysisResponseDTO analyze(BusinessFlowRequestDTO requestDTO) {
        List<SecurityIssue> issues = securityIssueRepository.findByResultId(requestDTO.getResultId());
        Map<String, List<SecurityIssue>> issueMap = issues.stream()
                .filter(issue -> issue.getEndpoint() != null && issue.getEndpoint().getPath() != null)
                .collect(Collectors.groupingBy(issue -> issue.getEndpoint().getPath()));
        List<BusinessFlowStepResultDTO> stepResults = new ArrayList<>();
        int totalStaticIssues = 0;
        int passedSteps = 0;
        for (String endpoint : requestDTO.getApiEndpoints()) {
            int staticCount = issueMap.getOrDefault(endpoint, Collections.emptyList()).size();
            boolean passed = staticCount == 0;
            if (passed) passedSteps++;
            totalStaticIssues += staticCount;
            stepResults.add(new BusinessFlowStepResultDTO(endpoint, staticCount, passed));
        }
        int totalSteps = requestDTO.getApiEndpoints().size();
        boolean overallPassed = passedSteps == totalSteps;
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
