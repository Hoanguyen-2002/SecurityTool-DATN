package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.BusinessFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


public interface BusinessFlowRepository extends JpaRepository<BusinessFlow, Integer> {
}
