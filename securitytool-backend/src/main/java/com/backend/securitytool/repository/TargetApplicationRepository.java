package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.TargetApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

public interface TargetApplicationRepository extends JpaRepository<TargetApplication, Integer> {
    List<TargetApplication> findByAppNameContainingIgnoreCase(String appName);
}
