package com.backend.securitytool.service.flowanalyzer;

import com.backend.securitytool.mapper.BusinessFlowMapper;
import com.backend.securitytool.model.dto.request.BusinessFlowRequestDTO;
import com.backend.securitytool.model.dto.response.BusinessFlowResponseDTO;
import com.backend.securitytool.model.entity.BusinessFlow;
import com.backend.securitytool.repository.BusinessFlowRepository;
import com.backend.securitytool.repository.ScanResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlowAnalyzerServiceImpl implements FlowAnalyzerService {

    private final BusinessFlowRepository businessFlowRepository;
    private final ScanResultRepository scanResultRepository;
    private final BusinessFlowMapper businessFlowMapper;

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
}
