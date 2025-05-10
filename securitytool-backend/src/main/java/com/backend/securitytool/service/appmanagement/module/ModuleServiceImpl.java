package com.backend.securitytool.service.appmanagement.module;

import com.backend.securitytool.exception.ResourceNotFoundException;
import com.backend.securitytool.mapper.SourceCodeModuleMapper;
import com.backend.securitytool.model.dto.request.ModuleRequestDTO;
import com.backend.securitytool.model.dto.response.ModuleResponseDTO;
import com.backend.securitytool.model.entity.SourceCodeModule;
import com.backend.securitytool.repository.SourceCodeModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleServiceImpl implements ModuleService {


    private SourceCodeModuleRepository repo;
    private SourceCodeModuleMapper mapper;

    @Autowired
    public ModuleServiceImpl(SourceCodeModuleRepository repo, SourceCodeModuleMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    public ModuleResponseDTO create(ModuleRequestDTO dto) {
                SourceCodeModule m = mapper.toEntity(dto);
                return mapper.toDto(repo.save(m));
    }

    public List<ModuleResponseDTO> list() {
        return repo.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public ModuleResponseDTO update(Integer id, ModuleRequestDTO dto) {
        SourceCodeModule m = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + id));

        m.setModuleName(dto.getModuleName());
        m.setDescription(dto.getDescription());
        m.setRepositoryPath(dto.getRepositoryPath());
               return mapper.toDto(repo.save(m));
           }

    public void delete(Integer id) {
        repo.deleteById(id);
    }
}
