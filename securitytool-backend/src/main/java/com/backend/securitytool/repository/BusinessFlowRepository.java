package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.BusinessFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface BusinessFlowRepository extends JpaRepository<BusinessFlow, Integer> {
    List<BusinessFlow> findByAppId(Integer appId);
    BusinessFlow findByFlowName(String flowName);
    Page<BusinessFlow> findByAppId(Integer appId, Pageable pageable);
    BusinessFlow findByFlowNameAndAppId(String flowName, Integer appId);
}
