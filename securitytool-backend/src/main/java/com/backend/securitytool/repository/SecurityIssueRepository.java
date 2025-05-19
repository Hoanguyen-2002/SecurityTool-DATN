package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.SecurityIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityIssueRepository extends JpaRepository<SecurityIssue, Integer> {
    // Add missing methods required by DashboardServiceImpl
    
    // Count issues by appId
    long countByAppId(Integer appId);
    
    // Group by severity and count for a specific app
    @Query("SELECT s.severity, COUNT(s) FROM SecurityIssue s WHERE s.appId = :appId GROUP BY s.severity")
    List<Object[]> countBySeverityAndAppId(@Param("appId") Integer appId);
    
    // Group by severity and count across all apps (fallback)
    @Query("SELECT s.severity, COUNT(s) FROM SecurityIssue s GROUP BY s.severity")
    List<Object[]> countBySeverity();

    List<SecurityIssue> findByResultAppId(Integer appId);
    List<SecurityIssue> findByResultId(Integer resultId);
    // Other existing methods...
}
