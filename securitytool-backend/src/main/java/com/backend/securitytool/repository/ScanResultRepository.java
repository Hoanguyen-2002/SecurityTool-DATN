package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.ScanResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


public interface ScanResultRepository extends JpaRepository<ScanResult, Integer> {
    Optional<ScanResult> findFirstByAppIdOrderByScanDateDesc(Integer appId);
}
