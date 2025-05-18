package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.ScanResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


public interface ScanResultRepository extends JpaRepository<ScanResult, Integer> {
    Optional<ScanResult> findFirstByAppIdOrderByScanDateDesc(Integer appId);
    List<ScanResult> findByAppIdAndScanType(Integer appId, String scanType);
    long countByAppIdAndScanType(Integer appId, String scanType);
}

