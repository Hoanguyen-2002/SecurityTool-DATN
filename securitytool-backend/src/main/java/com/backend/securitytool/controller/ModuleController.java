package com.backend.securitytool.controller;

import com.backend.securitytool.constants.ApiConstants;
import com.backend.securitytool.model.dto.request.ModuleRequestDTO;
import com.backend.securitytool.model.dto.response.CommonResponse;
import com.backend.securitytool.model.dto.response.ModuleResponseDTO;
import com.backend.securitytool.service.appmanagement.module.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.MODULES_BASE_URL)
@RequiredArgsConstructor
public class ModuleController {
    @Autowired
    private final ModuleService moduleService;



    @PostMapping
   public ResponseEntity<CommonResponse<ModuleResponseDTO>> create(@RequestBody ModuleRequestDTO dto) {
       ModuleResponseDTO m = moduleService.create(dto);
       return ResponseEntity.ok(new CommonResponse<>("success","Created",m, LocalDateTime.now()));
   }

   @GetMapping
   public ResponseEntity<CommonResponse<List<ModuleResponseDTO>>> list() {
               List<ModuleResponseDTO> ms = moduleService.list();
               return ResponseEntity.ok(new CommonResponse<>("success","OK",ms,LocalDateTime.now()));
   }

   @PutMapping("/{id}")
   public ResponseEntity<CommonResponse<ModuleResponseDTO>> update(@PathVariable Integer id, @RequestBody ModuleRequestDTO dto) {
       ModuleResponseDTO m = moduleService.update(id,dto);
       return ResponseEntity.ok(new CommonResponse<>("success","Updated",m,LocalDateTime.now()));
   }

   @DeleteMapping("/{id}")
   public ResponseEntity<CommonResponse<Void>> delete(@PathVariable Integer id) {
       moduleService.delete(id);
       return ResponseEntity.ok(new CommonResponse<>("success","Deleted",null,LocalDateTime.now()));
   }

}

