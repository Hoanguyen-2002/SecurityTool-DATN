package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.ScanConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


public interface ScanConfigurationRepository extends JpaRepository<ScanConfiguration, Integer> {
}
