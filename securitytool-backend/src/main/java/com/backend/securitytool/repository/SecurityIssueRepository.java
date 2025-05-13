package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.SecurityIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


public interface SecurityIssueRepository extends JpaRepository<SecurityIssue, Integer> {
    List<SecurityIssue> findByResultAppId(Integer appId);
    List<SecurityIssue> findByResultId(Integer resultId);
    @Query("SELECT s.severity, COUNT(s) FROM SecurityIssue s GROUP BY s.severity")
    List<Object[]> countBySeverity();
}


